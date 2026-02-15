// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@styles/index.css';
import { initializeThemeEarly } from '@utils/theme';
import { syncConfigWithFirebase } from '@utils/configSync';

/**
 * Initialize critical systems before React renders
 * This runs synchronously before the app mounts
 */
const initializeApp = () => {
  // Initialize theme early to prevent flash of wrong theme
  initializeThemeEarly();
};

/**
 * Initialize Firebase-dependent systems after app mounts
 * This runs asynchronously and doesn't block the initial render
 */
const initializeFirebaseSystems = async () => {
  try {
    // Wait a short moment for Firebase to initialize
    // This ensures the database connection is ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Sync config with Firebase
    // Ensures /config node reflects current app configuration (including env vars)
    // This will gracefully skip if user is not authenticated
    const result = await syncConfigWithFirebase();

    // Handle different outcomes
    if (result.success) {
      switch (result.action) {
        case 'updated':
          console.log('🔄 Config synced with Firebase:', result.differences);
          break;
        case 'initialized':
          console.log('📝 Config initialized in Firebase');
          break;
        case 'skipped':
          // Silently skipped (user not authenticated or permission denied)
          // Config will sync after login via useAuth hook
          break;
        case 'no-change':
          // Already in sync, no action needed
          break;
        default:
          console.log('✅ Config sync completed:', result.action);
      }
    } else {
      // Only log actual errors, not permission denials
      console.warn('⚠️  Config sync failed:', result.error);
    }
  } catch (error) {
    // Non-critical error - app can continue
    console.error('Failed to initialize Firebase systems:', error);
  }
};

// Run synchronous initialization
initializeApp();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Run asynchronous Firebase initialization after render
// This doesn't block the app from loading
initializeFirebaseSystems();
