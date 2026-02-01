// src/stores/useSettingsStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  detectSystemTheme,
  applyThemeToDOM,
  createSystemThemeListener,
  isDarkTheme,
  getEffectiveTheme,
} from '@utils/theme';

const appName = import.meta.env.VITE_APP_NAME || 'Vite React App';

export const useSettingsStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        theme: 'system',
        systemTheme: 'light',
        _themeInitialized: false,
        _isHydrated: false,

        // Theme Actions
        updateTheme: (theme) => {
          const { systemTheme } = get();
          set({ theme, _themeInitialized: true });
          applyThemeToDOM(theme, systemTheme);
        },

        updateSystemTheme: (systemTheme) => {
          const { theme } = get();
          set({ systemTheme });
          if (theme === 'system') {
            applyThemeToDOM(theme, systemTheme);
          }
        },

        initializeTheme: () => {
          const state = get();
          if (state._themeInitialized) return () => {};

          try {
            const systemTheme = detectSystemTheme();
            set({ systemTheme, _themeInitialized: true });
            applyThemeToDOM(state.theme, systemTheme);

            const cleanup = createSystemThemeListener((newSystemTheme) => {
              const currentState = get();
              set({ systemTheme: newSystemTheme });
              if (currentState.theme === 'system') {
                applyThemeToDOM(currentState.theme, newSystemTheme);
              }
            });

            return cleanup;
          } catch (error) {
            console.warn('🎨 Theme: Initialization failed:', error);
            return () => {};
          }
        },

        isDark: () => {
          const { theme, systemTheme } = get();
          return isDarkTheme(theme, systemTheme);
        },

        getEffectiveTheme: () => {
          const { theme, systemTheme } = get();
          return getEffectiveTheme(theme, systemTheme);
        },

        getFontSettings: () => {
          const { fontSize, fontFamily } = get();
          return { fontSize, fontFamily };
        },

        getThemeSettings: () => {
          const { theme, systemTheme } = get();
          return {
            theme,
            systemTheme,
            effectiveTheme: getEffectiveTheme(theme, systemTheme),
            isDark: isDarkTheme(theme, systemTheme),
          };
        },
      }),
      {
        name: appName + '-settings',
        version: 1,
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.warn(
              '🎨 Settings: Failed to hydrate from localStorage:',
              error,
            );
            return;
          }

          if (state) {
            const currentSystemTheme = detectSystemTheme();
            if (
              !state.systemTheme ||
              state.systemTheme !== currentSystemTheme
            ) {
              state.systemTheme = currentSystemTheme;
            }
            state._isHydrated = true;

            setTimeout(() => {
              if (state.initializeTheme) {
                state.initializeTheme();
              }
            }, 0);
          }
        },
      },
    ),
    {
      name: 'settings-store',
    },
  ),
);
