"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Protect routes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const publicRoutes = ["/", "/login", "/register"];
      if (!publicRoutes.includes(pathname)) {
        router.push("/login");
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const loadUserFromStorage = () => {
    try {
      const storedUser = localStorage.getItem("nutrition_user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to load user from storage:", error);
      localStorage.removeItem("nutrition_user");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password);

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data?.user) {
        const userData = response.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("nutrition_user", JSON.stringify(userData));

        // Redirect will happen from login page
        return { success: true };
      }

      return { success: false, error: "No user data received" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.register(userData);

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data?.user) {
        const user = response.data.user;
        setUser(user);
        setIsAuthenticated(true);
        localStorage.setItem("nutrition_user", JSON.stringify(user));

        return { success: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("nutrition_user");
      router.push("/login");
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
