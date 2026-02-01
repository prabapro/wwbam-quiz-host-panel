// src/config/routes.js

import { lazy } from 'react';

/**
 * Unified route configuration - single source of truth for:
 * - Route paths
 * - Component imports (lazy loaded)
 * - Route metadata
 * - Navigation structure
 * - SEO and sitemap data
 */

// Lazy load all page components
const Home = lazy(() => import('@pages/Home'));
const Login = lazy(() => import('@pages/Login'));
const Privacy = lazy(() => import('@pages/Privacy'));
const Terms = lazy(() => import('@pages/Terms'));
const NotFound = lazy(() => import('@pages/NotFound'));

/**
 * Complete route configuration
 * Each route defines: path, component, metadata, navigation info, and sitemap data
 */
export const ROUTE_CONFIG = {
  // Main routes
  HOME: {
    path: '/',
    component: Home,
    isIndex: true,
    title: 'Home',
    showInNav: false,
    requiresAuth: true, // Protected route
    sitemap_priority: 1.0,
    sitemap_changefreq: 'weekly',
  },

  // Auth routes
  LOGIN: {
    path: '/login',
    component: Login,
    title: 'Login',
    description: 'Host panel authentication',
    showInNav: false,
    requiresAuth: false, // Public route
    sitemap_priority: 0.3,
    sitemap_changefreq: 'monthly',
  },

  // Legal pages
  PRIVACY: {
    path: '/privacy',
    component: Privacy,
    title: 'Privacy Policy',
    description: 'How we protect and handle your data',
    showInNav: false,
    requiresAuth: false,
    category: 'legal',
    sitemap_priority: 0.5,
    sitemap_changefreq: 'monthly',
  },

  TERMS: {
    path: '/terms',
    component: Terms,
    title: 'Terms of Service',
    description: 'Terms and conditions for using the quiz system',
    showInNav: false,
    requiresAuth: false,
    category: 'legal',
    sitemap_priority: 0.5,
    sitemap_changefreq: 'monthly',
  },

  // Special routes (excluded from sitemap)
  NOT_FOUND: {
    path: '*',
    component: NotFound,
    title: 'Not Found',
    showInNav: false,
    requiresAuth: false,
    isWildcard: true,
    // No sitemap fields - excluded from sitemap
  },
};

// Helper functions to work with route config

/**
 * Get all route paths for validation
 */
export const getAllRoutePaths = () => {
  return Object.values(ROUTE_CONFIG)
    .filter((route) => !route.isWildcard)
    .map((route) => route.path);
};

/**
 * Check if a route path is known/valid
 */
export const isKnownRoute = (pathname) => {
  return getAllRoutePaths().includes(pathname);
};

/**
 * Get route config by path
 */
export const getRouteByPath = (pathname) => {
  return Object.values(ROUTE_CONFIG).find((route) => route.path === pathname);
};

/**
 * Get routes for navigation (filtered and categorized)
 */
export const getNavigationRoutes = () => {
  const routes = Object.values(ROUTE_CONFIG).filter((route) => route.showInNav);

  return {
    tools: routes.filter((route) => route.category === 'tools'),
    info: routes.filter((route) => route.category === 'info'),
    legal: routes.filter((route) => route.category === 'legal'),
    all: routes,
  };
};

/**
 * Get routes for sitemap generation
 */
export const getSitemapRoutes = () => {
  return Object.values(ROUTE_CONFIG).filter(
    (route) => !route.isWildcard && route.sitemap_priority !== undefined,
  );
};

/**
 * Convert route config to React Router format
 */
export const getRouterConfig = () => {
  return Object.values(ROUTE_CONFIG);
};

/**
 * Get route info for debugging/logging
 */
export const getRouteInfo = (pathname) => {
  const route = getRouteByPath(pathname);

  return {
    path: pathname,
    route,
    isKnown: isKnownRoute(pathname),
    isNotFound: !isKnownRoute(pathname),
    config: route || null,
  };
};

/**
 * Get protected routes (require authentication)
 */
export const getProtectedRoutes = () => {
  return Object.values(ROUTE_CONFIG).filter((route) => route.requiresAuth);
};

/**
 * Check if route requires authentication
 */
export const requiresAuth = (pathname) => {
  const route = getRouteByPath(pathname);
  return route?.requiresAuth || false;
};
