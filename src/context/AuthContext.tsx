import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserSchema } from "@insforge/shared-schemas";

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
      // Sensitive sections are still protected by the app PIN gate.
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
