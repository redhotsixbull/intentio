let _seq = 0;

/**
 * An abstract command. Created via [defineIntent]. The type parameter [P] is the
 * payload the command carries (defaults to `void`). Two intents are equal iff
 * they are the same object — identity, not name.
 */
export interface Intent<P = void> {
  /** Stable unique id used as the dispatch key. */
  readonly id: string;
  /** Human label for debugging / command-palette display. */
  readonly intentName: string;
  /** Phantom marker so payload types flow; never present at runtime. */
  readonly __payload?: P;
  /** So an intent can be used directly as an object key if desired. */
  toString(): string;
}

/**
 * Defines a typed, abstract command. [name] is only for debugging / palette
 * labels — identity is by object reference, so two `defineIntent('x')` calls are
 * distinct intents.
 */
export function defineIntent<P = void>(name?: string): Intent<P> {
  const id = `intentio:${_seq++}${name ? `:${name}` : ''}`;
  return {
    id,
    intentName: name ?? id,
    toString() {
      return id;
    },
  };
}

/** Extracts the payload type of an [Intent]. */
export type PayloadOf<I> = I extends Intent<infer P> ? P : never;
