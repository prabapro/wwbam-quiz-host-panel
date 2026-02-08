// src/components/layout/MobileMenu.jsx

import { Link, useLocation } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { useAuth } from '@hooks/useAuth';
import { getNavigationRoutes } from '@config/routes';
import { X, LogOut, Home, FileQuestion } from 'lucide-react';

export default function MobileMenu({ isOpen, onClose }) {
  const location = useLocation();
  const { logout, userEmail } = useAuth();

  // Get navigation routes
  const navRoutes = getNavigationRoutes();
  const mainRoutes = navRoutes.main || [];

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleNavClick = () => {
    onClose();
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  // Icon mapping for routes
  const getRouteIcon = (path) => {
    switch (path) {
      case '/':
        return <Home className="w-4 h-4" />;
      case '/questions':
        return <FileQuestion className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-background border-l shadow-lg md:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          {userEmail && (
            <div className="p-4 border-b bg-muted/30">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium truncate">{userEmail}</p>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {mainRoutes.map((route) => (
                <Link key={route.path} to={route.path} onClick={handleNavClick}>
                  <Button
                    variant={isActivePath(route.path) ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    size="lg">
                    {getRouteIcon(route.path)}
                    <span className="ml-2">{route.title}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
