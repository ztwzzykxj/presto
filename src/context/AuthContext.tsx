import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth';

interface AuthContextType {
  token: string | null;
  email: string | null;
  name: string | null;
   
  login: (_email: string, _password: string) => Promise<void>;
   
  register: (_email: string, _password: string, _name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'presto_token';
const EMAIL_KEY = 'presto_email';
const NAME_KEY = 'presto_name';

export { TOKEN_KEY, EMAIL_KEY, NAME_KEY };

 
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));
  const [name, setName] = useState<string | null>(() => localStorage.getItem(NAME_KEY));
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (_email: string, _password: string) => {
    setIsLoading(true);
    try {
      const { token: newToken } = await apiLogin(_email, _password);
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(EMAIL_KEY, _email);
      const displayName = _email.split('@')[0];
      localStorage.setItem(NAME_KEY, displayName);
      setToken(newToken);
      setEmail(_email);
      setName(displayName);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (_email: string, _password: string, _name: string) => {
    setIsLoading(true);
    try {
      const { token: newToken } = await apiRegister(_email, _password, _name);
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(EMAIL_KEY, _email);
      localStorage.setItem(NAME_KEY, _name);
      setToken(newToken);
      setEmail(_email);
      setName(_name);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        // Ignore logout errors — clear local state anyway
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(NAME_KEY);
    setToken(null);
    setEmail(null);
    setName(null);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, email, name, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
