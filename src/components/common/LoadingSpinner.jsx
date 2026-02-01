// src/components/common/LoadingSpinner.jsx

import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const LoadingSpinner = ({
  size = 'md',
  text = '',
  className = '',
  showText = true,
  variant = 'default', // 'default' | 'primary' | 'muted'
}) => {
  const spinnerClasses = cn(
    'animate-spin rounded-full border-2 border-solid',
    sizeMap[size],
    {
      'border-border border-t-foreground': variant === 'default',
      'border-primary/20 border-t-primary': variant === 'primary',
      'border-muted-foreground/20 border-t-muted-foreground':
        variant === 'muted',
    },
    className,
  );

  const textClasses = cn('text-sm', {
    'text-foreground': variant === 'default',
    'text-primary': variant === 'primary',
    'text-muted-foreground': variant === 'muted',
  });

  if (!showText && !text) {
    return <div className={spinnerClasses} aria-label="Loading" />;
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={spinnerClasses} aria-label="Loading" />
      {(showText || text) && (
        <p className={textClasses}>{text || 'Loading...'}</p>
      )}
    </div>
  );
};

// Inline spinner for buttons and small spaces
export const InlineSpinner = ({ size = 'sm', className = '' }) => (
  <div
    className={cn(
      'animate-spin rounded-full border-2 border-current border-t-transparent',
      sizeMap[size],
      className,
    )}
    aria-label="Loading"
  />
);

// Full page loading overlay
export const PageLoader = ({ text = 'Loading page...' }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <LoadingSpinner size="lg" text={text} variant="primary" />
  </div>
);

// Card/section loading skeleton
export const SkeletonLoader = ({ className = '' }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="space-y-3">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
    </div>
  </div>
);

export default LoadingSpinner;
