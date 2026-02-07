// src/components/layout/Footer.jsx

import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const kofiLink = `${import.meta.env.VITE_KOFI_URL}footer`;

  return (
    <>
      <footer className="border-t border-border/30 bg-muted/5 mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Copyright */}
            <div className="text-center">
              <p className="text-sm md:text-sm text-muted-foreground/70 leading-relaxed">
                {/* Mobile: Multi-line layout */}
                <span className="block md:inline">
                  Made with ♥️ by{' '}
                  <a
                    href={kofiLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/70 hover:text-foreground transition-colors duration-200 hover:underline decoration-dotted underline-offset-4">
                    @prabapro
                  </a>
                </span>
                {/* Mobile: Second line */}
                <span className="block md:hidden text-xs mt-1">
                  © {currentYear} XXX - All rights reserved.
                </span>
                {/* Desktop: Same line continuation */}
                <span className="hidden md:inline">
                  {' '}
                  © {currentYear} All rights reserved.
                </span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
