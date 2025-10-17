import { create } from 'zustand';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    
    const response = await api.login(username, password);
    
    if (response.error) {
      set({ isLoading: false });
      return { success: false, error: response.error };
    }

    set({ 
      user: response.data?.user || null, 
      isAuthenticated: true,
      isLoading: false 
    });
    
    return { success: true };
  },

  register: async (userData: RegisterData) => {
    set({ isLoading: true });
    
    const response = await api.register(userData);
    
    if (response.error) {
      set({ isLoading: false });
      return { success: false, error: response.error };
    }

    set({ 
      user: response.data?.user || null, 
      isAuthenticated: true,
      isLoading: false 
    });
    
    return { success: true };
  },

  logout: async () => {
    await api.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    const response = await api.getCurrentUser();
    
    if (response.data?.user) {
      set({ 
        user: response.data.user, 
        isAuthenticated: true,
        isLoading: false 
      });
    } else {
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },
}));