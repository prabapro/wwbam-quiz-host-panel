// src/utils/theme.js

/**
 * Theme utilities
 * Contains all theme-related helper functions and early initialization logic
 */

// System theme detection utility
export const detectSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    console.warn(
      '🎨 Theme: Failed to detect system theme, defaulting to light',
    );
    return 'light';
  }
};

// Theme application utility
export const applyThemeToDOM = (theme, systemTheme) => {
  if (typeof document === 'undefined') return;

  try {
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    document.documentElement.className = effectiveTheme;
  } catch (error) {
    console.warn('🎨 Theme: Failed to apply theme to DOM:', error);
  }
};

// Early theme initialization (before React renders)
let earlyInitDone = false;

export const initializeThemeEarly = () => {
  if (earlyInitDone || typeof window === 'undefined') return;

  try {
    const systemTheme = detectSystemTheme();

    let storedTheme = 'system';
    try {
      const appName = import.meta.env.VITE_APP_NAME;

      if (!appName) {
        console.warn('🎨 Theme: VITE_APP_NAME not found in environment');
      }

      const storageKey = `${appName}-settings`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state?.theme) {
          storedTheme = parsed.state.theme;
        }
      }
    } catch {
      // Ignore localStorage errors, use default
    }

    applyThemeToDOM(storedTheme, systemTheme);
    earlyInitDone = true;
  } catch (error) {
    console.warn('🎨 Theme: Early initialization failed:', error);
  }
};

// Get effective theme from theme and system theme values
export const getEffectiveTheme = (theme, systemTheme) => {
  return theme === 'system' ? systemTheme : theme;
};

// Check if current theme is dark
export const isDarkTheme = (theme, systemTheme) => {
  return theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
};

// Create system theme change listener
export const createSystemThemeListener = (callback) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      callback(newSystemTheme);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  } catch (error) {
    console.warn('🎨 Theme: Failed to create system theme listener:', error);
    return () => {};
  }
};

// Validate theme value
export const isValidTheme = (theme) => {
  return ['light', 'dark', 'system'].includes(theme);
};

// Default theme settings
export const DEFAULT_THEME_SETTINGS = {
  theme: 'system',
  systemTheme: 'light',
};
