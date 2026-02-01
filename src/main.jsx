// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@styles/index.css';
import { initializeThemeEarly } from '@utils/theme';

// Initialize critical systems before React renders
const initializeApp = () => {
  // Initialize theme early to prevent flash of wrong theme
  initializeThemeEarly();
};

// Run initialization
initializeApp();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
