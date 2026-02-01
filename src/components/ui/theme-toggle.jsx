// src/components/ui/theme-toggle.jsx

import { Button } from '@components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@components/ui/tooltip';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className, variant = 'muted', size = 'sm' }) {
  const { setTheme, isDark } = useTheme();

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const icon = isDark ? <Sun /> : <Moon />;
  const tooltipText = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleToggle}
            className={cn(
              'transition-all duration-200 hover:scale-105 cursor-pointer',
              className,
            )}
            aria-label={tooltipText}>
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
