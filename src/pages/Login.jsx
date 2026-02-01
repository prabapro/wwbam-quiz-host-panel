// src/pages/Login.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import LoadingSpinner from '@components/common/LoadingSpinner';

export default function Login() {
  const navigate = useNavigate();
  const {
    login,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    clearError,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formError, setFormError] = useState('');

  // Redirect if already authenticated (e.g., user navigates to /login while logged in)
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (formError) setFormError('');
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password) {
      setFormError('Please enter both email and password');
      return;
    }

    // Attempt login
    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Wait a tiny bit for state to propagate, then navigate
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 150);
    }
    // Error is handled by useAuth hook and displayed via error state
  };

  // Show loading spinner while checking initial auth state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Host Panel Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to access the quiz host panel
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="host@example.com"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {(error || formError) && (
              <div className="flex items-start space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error || formError}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg">
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </span>
              )}
            </Button>
          </form>

          {/* Development Note */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground text-center">
                Development Mode: Create host account in Firebase Console
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
