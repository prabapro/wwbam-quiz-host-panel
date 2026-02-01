// src/pages/NotFound.jsx

import { Link } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
      {/* 404 Illustration */}
      <div className="space-y-4">
        <div className="text-6xl md:text-8xl font-bold text-muted-foreground/30">
          404
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Page Not Found
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/">
          <Button className="flex items-center space-x-2">
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </Link>

        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </Button>
      </div>
    </div>
  );
}
