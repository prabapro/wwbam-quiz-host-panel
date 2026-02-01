// src/hooks/useAuth.js

import { useEffect } from 'react';
import { useAuthStore } from '@stores/useAuthStore';
import { authService } from '@services/auth.service';

/**
 * Custom hook for authentication
 * Provides auth state and actions
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    setUser,
    setLoading,
    setInitialized,
    setError,
    clearError,
    logout: storeLogout,
  } = useAuthStore();

  // Subscribe to auth state changes on mount
  useEffect(() => {
    // Only initialize once
    if (isInitialized) return;

    setLoading(true);

    const unsubscribe = authService.onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        // User is signed out
        setUser(null);
      }

      // Mark as initialized and stop loading
      setInitialized(true);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [isInitialized, setUser, setLoading, setInitialized]);

  /**
   * Login handler
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Result object
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      clearError();

      const result = await authService.login(email, password);

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return result;
      }

      // Manually update user state immediately after successful login
      // This ensures the state is updated before navigation
      if (result.user) {
        setUser({
          uid: result.user.uid,
          email: result.user.email,
          emailVerified: result.user.emailVerified,
        });
      }

      // Clear loading state
      setLoading(false);

      // Small delay to ensure state propagation to localStorage
      await new Promise((resolve) => setTimeout(resolve, 100));

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Logout handler
   * @returns {Promise<Object>} Result object
   */
  const logout = async () => {
    try {
      setLoading(true);
      clearError();

      const result = await authService.logout();

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return result;
      }

      // Clear user from store
      storeLogout();
      setLoading(false);
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Logout failed';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,

    // Actions
    login,
    logout,
    clearError,

    // Utilities
    userEmail: user?.email || null,
    userId: user?.uid || null,
  };
};

export default useAuth;
