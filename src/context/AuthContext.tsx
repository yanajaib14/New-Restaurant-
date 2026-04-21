import React, { createContext, useContext, useEffect, useState } from "react";
import { insforge } from "../services/insforge";
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
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        setUser(data.user);
        // Map any existing user metadata role. If none, default to Manager or just use their name logic.
        const metaRole = (data.user.metadata as any)?.role || "Manager";
        setRole(metaRole);
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: error.message };
    if (data?.user) {
      setUser(data.user);
      setRole((data.user.metadata as any)?.role || "Manager");
    }
    return {};
  };

  const register = async (email: string, pass: string, name: string) => {
    // For prototype purposes, let's auto-assign role based on name or allow it to be Manager.
    const assignedRole = email.includes("owner") ? "Owner" : "Manager";
    const { error, data } = await insforge.auth.signUp({ 
      email, 
      password: pass, 
      name,
      // Pass metadata if InsForge auth supports it this way
    });
    // Wait for auto sign in to populate user in database and then we can update the user_metadata to set role
    if (error) return { error: error.message };
    
    // Attempt auto-login if signUp doesn't automatically do it
    if (!data?.user && !error) {
       await login(email, pass);
    }
    
    return {};
  };

  const logout = async () => {
    await insforge.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
