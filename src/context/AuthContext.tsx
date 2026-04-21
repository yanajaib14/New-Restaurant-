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

  const normalizeRoleForEmail = (email?: string, fallbackRole = "Manager") => {
    const normalized = String(email || "").trim().toLowerCase();
    if (normalized === "yanajaib@gmail.com") return "Owner";
    return fallbackRole;
  };

  const resolveAccess = async (email?: string, userId?: string, name?: string, requestedRole?: string) => {
    if (!email) return { isActive: true, role: requestedRole || "Manager" };

    try {
      const checkRes = await fetch(`/api/access/check?email=${encodeURIComponent(email)}`);
      const check = await checkRes.json();
      if (check.exists && !check.isActive) {
        return { isActive: false, role: check.role || "Manager" };
      }

      const normalizedRole = normalizeRoleForEmail(email, requestedRole || check.role || "Manager");

      const upsertRes = await fetch("/api/access/upsert-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId, name, role: normalizedRole }),
      });

      const upsert = await upsertRes.json();
      return { isActive: upsert.isActive !== false, role: upsert.role || normalizedRole || "Manager" };
    } catch {
      return { isActive: true, role: normalizeRoleForEmail(email, requestedRole || "Manager") };
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        const profile = data.user as any;
        const email = profile.email as string | undefined;
        const name = (profile.metadata as any)?.name || profile.name || "User";
        const requestedRole = normalizeRoleForEmail(email, (profile.metadata as any)?.role || "Manager");

        const access = await resolveAccess(email, profile.id, name, requestedRole);
        if (!access.isActive) {
          await insforge.auth.signOut();
          setUser(null);
          setRole(null);
        } else {
          setUser(data.user);
          setRole(access.role || "Manager");
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: error.message };
    if (data?.user) {
      const profile = data.user as any;
      const name = (profile.metadata as any)?.name || profile.name || "User";
      const requestedRole = normalizeRoleForEmail(profile.email, (profile.metadata as any)?.role || "Manager");
      const access = await resolveAccess(profile.email, profile.id, name, requestedRole);

      if (!access.isActive) {
        await insforge.auth.signOut();
        setUser(null);
        setRole(null);
        return { error: "Your access has been revoked. Contact the owner." };
      }

      setUser(data.user);
      setRole(access.role || "Manager");
    }
    return {};
  };

  const register = async (email: string, pass: string, name: string) => {
    const assignedRole = normalizeRoleForEmail(email, email.includes("owner") ? "Owner" : "Manager");
    const { error, data } = await insforge.auth.signUp({ 
      email, 
      password: pass, 
      name,
    });
    if (error) return { error: error.message };

    if (!data?.user && !error) {
       await login(email, pass);
    } else if (data?.user) {
      const profile = data.user as any;
      const access = await resolveAccess(profile.email, profile.id, name || "User", assignedRole);
      if (!access.isActive) {
        await insforge.auth.signOut();
        return { error: "Your access has been revoked. Contact the owner." };
      }
      setUser(data.user);
      setRole(access.role || assignedRole);
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
