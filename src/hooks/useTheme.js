// src/hooks/useTheme.js

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@stores/useSettingsStore';

/**
 * Custom hook for theme management
 */
export const useTheme = () => {
  const cleanupRef = useRef(null);

  const {
    theme,
    systemTheme,
    updateTheme,
    updateSystemTheme,
    initializeTheme,
    isDark,
    getEffectiveTheme,
    _isHydrated,
    _themeInitialized,
  } = useSettingsStore();

  // Initialize theme system once when hook mounts and store is hydrated
  useEffect(() => {
    // Only initialize if store is hydrated and theme hasn't been initialized yet
    if (_isHydrated && !_themeInitialized && !cleanupRef.current) {
      cleanupRef.current = initializeTheme();
    }

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [_isHydrated, _themeInitialized, initializeTheme]);

  return {
    // Current theme state
    theme,
    systemTheme,

    // Actions
    setTheme: updateTheme,
    setSystemTheme: updateSystemTheme,

    // Computed values
    isDark: isDark(),
    effectiveTheme: getEffectiveTheme(),

    // Status flags
    isHydrated: _isHydrated,
    isInitialized: _themeInitialized,
  };
};
