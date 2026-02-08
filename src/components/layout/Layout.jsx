// src/components/layout/Layout.jsx

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileMenu from './MobileMenu';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuOpen = () => {
    setIsMobileMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header onMenuClick={handleMenuOpen} />

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <Footer />

      <MobileMenu isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
    </div>
  );
}
