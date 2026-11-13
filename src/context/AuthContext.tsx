import React, { createContext, useContext, useEffect, useState } from "react";
type UserSchema = { id: string; email?: string; name?: string; metadata?: Record<string, any> };

interface AuthContextType {
  user: UserSchema | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  register: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSchema | null>(null);
  const [role, setRole] = useState<string | null>("Owner");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapOpenAccess = async () => {
      // Open access mode: any user with the URL can use the app.
      // The device PIN only hides views; it is not account authorization.
      setUser({
        id: "guest-open-access",
        email: "guest@open-access.local",
        name: "Open Access",
        metadata: { name: "Open Access", role: "Owner" },
      } as any);
      setRole("Owner");
      setIsLoading(false);
    };

    bootstrapOpenAccess();
  }, []);

  const login = async (_email: string, _pass: string) => {
    return {};
  };

  const register = async (_email: string, _pass: string, _name: string) => {
    return {};
  };

  const logout = async () => {
    // Open access mode: keep session available, only close sensitive views in UI.
    setRole("Owner");
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
