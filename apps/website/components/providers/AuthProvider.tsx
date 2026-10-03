"use client";

import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  /** `admin` or `superadmin` profile role; false while loading and for visitors. */
  isAdmin: boolean;
  /** True until the session (and, when signed in, the role) has been read. */
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  // The role read for one user id; derived values below compare the ids, so
  // a login or logout (setUser) needs no reset.
  const [role, setRole] = useState<{ userId: string; isAdmin: boolean } | null>(
    null,
  );
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      // Without a session supabase-js answers from storage: no request.
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setSessionLoaded(true);
    };
    getUser();
  }, [supabase]);

  // The role is read once per signed-in user; visitors never query anything.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const getRole = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (cancelled) return;
      setRole({
        userId,
        isAdmin: profile?.role === "admin" || profile?.role === "superadmin",
      });
    };
    getRole();
    return () => {
      cancelled = true;
    };
  }, [userId, supabase]);

  const roleLoaded = !!userId && role?.userId === userId;
  const isAdmin = roleLoaded && role.isAdmin;
  const isLoading = !sessionLoaded || (!!userId && !roleLoaded);

  return (
    <AuthContext.Provider value={{ user, setUser, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
