// src/components/layout/MobileMenu.jsx

import { useEffect } from 'react';
import { X } from 'lucide-react';
import Navigation from './Navigation';
import { ThemeToggle } from '@components/ui/theme-toggle';

const appName = import.meta.env.VITE_APP_NAME_CLEANED;
const appVersion = import.meta.env.VITE_APP_VERSION;

export default function MobileMenu({ isOpen, onClose }) {
  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-background/95 backdrop-blur-md border-l border-border/40 z-50 md:hidden shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/30">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground/70 hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-lg"
              aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-6 overflow-y-auto">
            <Navigation mobile onItemClick={onClose} />
          </div>

          {/* Footer with Theme Toggle */}
          <div className="p-6 border-t border-border/30 space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Theme</span>
              <ThemeToggle />
            </div>

            {/* Version */}
            <div className="text-xs text-muted-foreground/60 text-center">
              {appName} v{appVersion}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
