import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Actions, defineIntent, handle, Shortcuts, useIntent } from '../src';

const SelectAll = defineIntent('select-all');
const Delete = defineIntent<{ soft?: boolean }>('delete');

describe('intentio — focus-scoped command dispatch', () => {
  it('the SAME shortcut resolves to a different action based on where focus is', async () => {
    const user = userEvent.setup();
    const selectText = vi.fn();
    const selectFiles = vi.fn();

    render(
      <Shortcuts map={{ 'Mod+a': SelectAll }}>
        <Actions handlers={[handle(SelectAll, selectText)]}>
          <input data-testid="input" />
        </Actions>
        <Actions handlers={[handle(SelectAll, selectFiles)]}>
          <div data-testid="list" tabIndex={0}>
            file list
          </div>
        </Actions>
      </Shortcuts>,
    );

    // Focus the text field → Ctrl+A means "select all text".
    (screen.getByTestId('input') as HTMLInputElement).focus();
    await user.keyboard('{Control>}a{/Control}');
    expect(selectText).toHaveBeenCalledTimes(1);
    expect(selectFiles).not.toHaveBeenCalled();

    // Focus the file list → the exact same Ctrl+A means "select all files".
    (screen.getByTestId('list') as HTMLDivElement).focus();
    await user.keyboard('{Control>}a{/Control}');
    expect(selectFiles).toHaveBeenCalledTimes(1);
    expect(selectText).toHaveBeenCalledTimes(1); // unchanged
  });

  it('an inner scope overrides an outer one (deepest wins)', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    const inner = vi.fn();

    render(
      <Shortcuts map={{ 'Mod+a': SelectAll }}>
        <Actions handlers={[handle(SelectAll, outer)]}>
          <Actions handlers={[handle(SelectAll, inner)]}>
            <div data-testid="leaf" tabIndex={0}>
              leaf
            </div>
          </Actions>
        </Actions>
      </Shortcuts>,
    );

    (screen.getByTestId('leaf') as HTMLDivElement).focus();
    await user.keyboard('{Control>}a{/Control}');
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it('a disabled nearer handler is skipped; an enabled outer one runs', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    const inner = vi.fn();

    render(
      <Shortcuts map={{ 'Mod+a': SelectAll }}>
        <Actions handlers={[handle(SelectAll, outer)]}>
          <Actions handlers={[handle(SelectAll, inner, { enabled: false })]}>
            <div data-testid="leaf" tabIndex={0}>
              leaf
            </div>
          </Actions>
        </Actions>
      </Shortcuts>,
    );

    (screen.getByTestId('leaf') as HTMLDivElement).focus();
    await user.keyboard('{Control>}a{/Control}');
    expect(inner).not.toHaveBeenCalled();
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it('a button (useIntent) shares the enabled state and dispatch path of the same intent', async () => {
    const user = userEvent.setup();
    const del = vi.fn();

    function DeleteButton() {
      const { invoke, isEnabled } = useIntent(Delete);
      return (
        <button data-testid="del" disabled={!isEnabled} onClick={() => invoke({ soft: true })}>
          delete
        </button>
      );
    }

    function App({ enabled }: { enabled: boolean }) {
      return (
        <Actions handlers={[handle(Delete, del, { enabled })]}>
          <DeleteButton />
        </Actions>
      );
    }

    const { rerender } = render(<App enabled={false} />);
    // No selection → the same source of truth greys out the button.
    expect((screen.getByTestId('del') as HTMLButtonElement).disabled).toBe(true);

    rerender(<App enabled />);
    expect((screen.getByTestId('del') as HTMLButtonElement).disabled).toBe(false);

    await user.click(screen.getByTestId('del'));
    expect(del).toHaveBeenCalledWith({ soft: true });
  });

  it('does nothing when no binding matches (normal typing is untouched)', async () => {
    const user = userEvent.setup();
    const selectText = vi.fn();

    render(
      <Shortcuts map={{ 'Mod+a': SelectAll }}>
        <Actions handlers={[handle(SelectAll, selectText)]}>
          <input data-testid="input" />
        </Actions>
      </Shortcuts>,
    );

    const input = screen.getByTestId('input') as HTMLInputElement;
    input.focus();
    await user.keyboard('hello');
    expect(input.value).toBe('hello');
    expect(selectText).not.toHaveBeenCalled();
  });
});
