import { createContext } from 'react';
import type { ScopeNode } from './registry';

/** The nearest enclosing `Actions` scope, or null at the root. */
export const ActionsContext = createContext<ScopeNode | null>(null);
