import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Configuration simple du stockage
const zustandStorage = createJSONStorage(() => AsyncStorage);

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'employee';
  permissions: {
    clients: boolean;
    documents: boolean;
    chantiers: boolean;
    calculs_pac: boolean;
    catalogues: boolean;
    chat: boolean;
    parametres: boolean;
  };
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            username,
            password,
          });

          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
          });

          // Set default axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        delete axios.defaults.headers.common['Authorization'];
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      storage: zustandStorage,
    }
  )
);