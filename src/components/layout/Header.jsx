// src/components/layout/Header.jsx

import { Link, useLocation } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { ThemeToggle } from '@components/ui/theme-toggle';
import { useAuth } from '@hooks/useAuth';
import { getNavigationRoutes } from '@config/routes';
import { LogOut, Menu } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { isAuthenticated, logout, userEmail } = useAuth();

  // Get navigation routes
  const navRoutes = getNavigationRoutes();
  const mainRoutes = navRoutes.main || [];

  const handleLogout = async () => {
    await logout();
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/wwbam-logo.svg"
                alt="WWBAM Logo"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">WWBAM</span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && mainRoutes.length > 0 && (
              <nav className="hidden md:flex items-center gap-1">
                {mainRoutes.map((route) => (
                  <Link key={route.path} to={route.path}>
                    <Button
                      variant={isActivePath(route.path) ? 'secondary' : 'ghost'}
                      size="sm">
                      {route.title}
                    </Button>
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right: Theme Toggle + User Info + Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Info & Logout (Desktop) */}
            {isAuthenticated && (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {userEmail}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={onMenuClick}>
                  <Menu className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
