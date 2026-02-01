// src/components/common/ScrollToTop.jsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Automatically scrolls to the top of the page when the route changes
 * Should be placed inside BrowserRouter but outside of Routes
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth', // Smooth scrolling for better UX
    });
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
