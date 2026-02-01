// src/stores/useAuthStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const appName = import.meta.env.VITE_APP_NAME || 'wwbam-quiz-host-panel';

/**
 * Authentication Store
 * Manages authentication state using Zustand
 * Persists user session in localStorage
 */
export const useAuthStore = create()(
  devtools(
    persist(
      (set) => ({
        // Initial State
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false,
        error: null,

        // Actions
        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
            error: null,
          }),

        setLoading: (isLoading) => set({ isLoading }),

        setInitialized: (isInitialized) => set({ isInitialized }),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        logout: () =>
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          }),

        // Reset entire auth state
        reset: () =>
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,
            error: null,
          }),
      }),
      {
        name: `${appName}-auth`,
        version: 1,

        // Only persist user data, not loading/error states
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),

        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.warn(
              '🔐 Auth: Failed to hydrate from localStorage:',
              error,
            );
            return;
          }

          if (state) {
            console.log('🔐 Auth: Hydrated from localStorage');
            // Don't mark as initialized yet - let the auth listener do that
            state.isInitialized = false;
          }
        },
      },
    ),
    {
      name: 'auth-store',
    },
  ),
);

export default useAuthStore;
