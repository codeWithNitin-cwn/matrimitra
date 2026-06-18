import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, LoginCredentials, User } from './auth.service';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (credentials) => {
        try {
          const { token, user } = await authService.login(credentials);
          set({ token, user, isAuthenticated: true });
        } catch (error) {
          console.error('Login failed in auth store:', error);
          set({ token: null, user: null, isAuthenticated: false });
          throw error;
        }
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }), // Only persist token & user
      onRehydrateStorage: () => (state) => {
        if (state) state.isAuthenticated = !!state.token;
      },
    }
  )
);
