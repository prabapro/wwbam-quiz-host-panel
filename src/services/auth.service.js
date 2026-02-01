// src/services/auth.service.js

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@config/firebase';

/**
 * Authentication Service
 * Handles all Firebase Authentication operations
 */

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<UserCredential>} User credential object
 */
export const login = async (email, password) => {
  try {
    // Set persistence to LOCAL (session persists across browser restarts)
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    console.log('✅ Login successful:', userCredential.user.email);
    return {
      success: true,
      user: userCredential.user,
      error: null,
    };
  } catch (error) {
    console.error('❌ Login failed:', error.message);

    // Map Firebase error codes to user-friendly messages
    const errorMessage = getAuthErrorMessage(error.code);

    return {
      success: false,
      user: null,
      error: errorMessage,
    };
  }
};

/**
 * Logout current user
 * @returns {Promise<Object>} Success/error object
 */
export const logout = async () => {
  try {
    await signOut(auth);
    console.log('✅ Logout successful');
    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('❌ Logout failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function called when auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

/**
 * Get current user
 * @returns {User|null} Current Firebase user or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

/**
 * Get user email
 * @returns {string|null} User email or null
 */
export const getUserEmail = () => {
  return auth.currentUser?.email || null;
};

/**
 * Get user ID
 * @returns {string|null} User ID or null
 */
export const getUserId = () => {
  return auth.currentUser?.uid || null;
};

/**
 * Map Firebase auth error codes to user-friendly messages
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/too-many-requests':
      'Too many failed attempts. Please try again later',
    'auth/network-request-failed':
      'Network error. Please check your connection',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/email-already-in-use': 'Email is already registered',
  };

  return errorMessages[errorCode] || 'Authentication failed. Please try again.';
};

/**
 * Auth service utilities
 */
export const authService = {
  login,
  logout,
  onAuthChange,
  getCurrentUser,
  isAuthenticated,
  getUserEmail,
  getUserId,
};

export default authService;
