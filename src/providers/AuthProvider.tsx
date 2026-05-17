// src/providers/AuthProvider.tsx

"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export type UserRole =
  | "ADMIN"
  | "CUSTOMER"
  | "INVENTORY_MANAGER"
  | "SALES_STAFF"
  | "DELIVERY_STAFF";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isEmailVerified?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: AuthUser;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ["/", "/products", "/login", "/register", "/unauthorized"];

function isPublicRoute(pathname: string) {
  if (publicRoutes.includes(pathname)) return true;

  if (pathname.startsWith("/products/")) return true;

  return false;
}

function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

function getDefaultRedirectByRole(role: UserRole) {
  if (role === "CUSTOMER") {
    return "/";
  }

  return "/admin/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse = await response.json();

      if (response.ok && result.success && result.data) {
        setUser(result.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    void Promise.resolve().then(() => refreshUser());
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const loggedIn = !!user;

    if (isAuthRoute(pathname) && loggedIn) {
      router.replace(getDefaultRedirectByRole(user.role));
      return;
    }

    if (!isPublicRoute(pathname) && !loggedIn) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
  }, [isLoading, user, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
