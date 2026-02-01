// src/components/layout/Navigation.jsx

import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@components/ui/navigation-menu';
import { Mail } from 'lucide-react';

export default function Navigation({ mobile = false, onItemClick }) {
  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  // Mobile navigation
  if (mobile) {
    return (
      <nav className="flex flex-col space-y-1">
        {/* Terms */}
        <Link
          to="/terms"
          className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full group text-muted-foreground/80 hover:text-foreground hover:bg-accent/50"
          onClick={handleItemClick}>
          <Mail className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform duration-200" />
          <span className="group-hover:translate-x-0.5 transition-transform duration-200">
            Terms
          </span>
        </Link>

        {/* Privacy Policy */}
        <Link
          to="/privacy"
          className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full group text-muted-foreground/80 hover:text-foreground hover:bg-accent/50"
          onClick={handleItemClick}>
          <Mail className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform duration-200" />
          <span className="group-hover:translate-x-0.5 transition-transform duration-200">
            Privacy Policy
          </span>
        </Link>
      </nav>
    );
  }

  // Desktop navigation
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Terms */}
        <NavigationMenuItem>
          <Link to="/terms" className={navigationMenuTriggerStyle()}>
            Terms
          </Link>
        </NavigationMenuItem>
        {/* Privacy Policy */}
        <NavigationMenuItem>
          <Link to="/privacy" className={navigationMenuTriggerStyle()}>
            Privacy Policy
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
