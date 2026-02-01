// src/components/layout/Header.jsx

import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navigation from './Navigation';
import { ThemeToggle } from '@components/ui/theme-toggle';

export default function Header({ onMobileMenuToggle, isMobileMenuOpen }) {
  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-70 transition-opacity duration-200"
              aria-label="Hoptira - Go to homepage">
              <img
                src="images/hoptira-logo.svg"
                alt="Hoptira Logo"
                className="h-8 w-auto transition-opacity duration-200"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center">
            <Navigation />
          </div>

          {/* Theme Toggle - Right */}
          <div className="hidden md:flex items-center">
            <ThemeToggle />
          </div>

          {/* Mobile controls - Right */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={onMobileMenuToggle}
              className="p-2 text-muted-foreground/70 hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-lg"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
