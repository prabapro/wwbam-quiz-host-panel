// src/routes/AppRouter.jsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorBoundary from '@components/common/ErrorBoundary';
import ScrollToTop from '@components/common/ScrollToTop';
import ProtectedRoute from '@components/auth/ProtectedRoute';
import { getRouterConfig } from '@config/routes';
import Layout from '@components/layout/Layout';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner size="lg" text="Loading page..." />
  </div>
);

// Error fallback for lazy loading failures
const LazyErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <h2 className="text-xl font-semibold text-foreground">
      Failed to load page
    </h2>
    <p className="text-muted-foreground text-center max-w-md">
      {error?.message || 'There was an error loading this page.'}
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
      Try Again
    </button>
  </div>
);

// Route wrapper component with error boundary and suspense
const RouteWrapper = ({ component: Component, requiresAuth }) => {
  const element = (
    <ErrorBoundary fallback={LazyErrorFallback}>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );

  // Wrap with ProtectedRoute if authentication is required
  if (requiresAuth) {
    return <ProtectedRoute>{element}</ProtectedRoute>;
  }

  return element;
};

// Helper function to create a route element
const createRouteElement = (routeConfig) => {
  const { path, component, isIndex, isWildcard, requiresAuth } = routeConfig;
  const routeKey = isIndex ? 'index' : isWildcard ? 'wildcard' : path;

  const element = (
    <RouteWrapper component={component} requiresAuth={requiresAuth} />
  );

  if (isIndex) {
    return <Route key={routeKey} index element={element} />;
  }

  if (isWildcard) {
    return <Route key={routeKey} path={path} element={element} />;
  }

  // Clean path for regular routes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return <Route key={routeKey} path={cleanPath} element={element} />;
};

// App Routes component
function AppRoutes() {
  const routes = getRouterConfig();

  return <Routes>{routes.map(createRouteElement)}</Routes>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      {/* ScrollToTop component - listens to route changes and scrolls to top */}
      <ScrollToTop />

      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  );
}
