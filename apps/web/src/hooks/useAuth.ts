import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextValue } from '../types/auth';

/** The only sanctioned way to read auth state/actions — throws early (not a silent `undefined`) if used outside AuthProvider, since that's always a real mistake, not a valid state to handle gracefully. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
