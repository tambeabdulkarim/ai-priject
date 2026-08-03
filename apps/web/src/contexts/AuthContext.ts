// The raw React Context — only AuthProvider (which supplies the value)
// and useAuth (which consumes it) touch this directly. Feature code
// always goes through the `useAuth` hook, never `useContext(AuthContext)`
// itself, per docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md §3's folder-role
// separation.

import { createContext } from 'react';
import type { AuthContextValue } from '../types/auth';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
