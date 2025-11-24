import { persistentAtom } from "@nanostores/persistent";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export const $auth = persistentAtom<AuthState>(
  "auth",
  {
    isAuthenticated: false,
    user: null,
    token: null,
  },
  { encode: JSON.stringify, decode: JSON.parse }
);