// src/components/layout/Footer.jsx

import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const kofiLink = `${import.meta.env.VITE_KOFI_URL}footer`;

  return (
    <>
      <footer className="border-t border-border/30 bg-muted/5 mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-center md:text-left">
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

            {/* Footer Links */}
            <div className="flex items-center space-x-8 text-sm md:text-sm">
              <Link
                to="/privacy"
                className="text-muted-foreground/70 hover:text-foreground transition-colors duration-200 hover:underline decoration-dotted underline-offset-4">
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-muted-foreground/70 hover:text-foreground transition-colors duration-200 hover:underline decoration-dotted underline-offset-4">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
