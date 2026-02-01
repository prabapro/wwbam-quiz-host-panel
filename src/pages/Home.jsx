// src/pages/Home.jsx

import { Button } from '@components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import FirebaseTest from '@components/test/FirebaseTest';

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Quiz Host Panel</h1>

        {isAuthenticated && (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Welcome, <span className="font-medium">{user?.email}</span>
            </p>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        )}
      </div>

      {/* Firebase Integration Test */}
      <div className="w-full max-w-2xl">
        <FirebaseTest />
      </div>

      {/* Development Info */}
      {import.meta.env.DEV && (
        <div className="p-4 bg-muted/30 rounded-lg max-w-2xl">
          <h3 className="text-sm font-medium mb-2">Development Mode</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Firebase integration is ready</li>
            <li>• Test read/write operations above</li>
            <li>• Check browser console for detailed logs</li>
          </ul>
        </div>
      )}
    </main>
  );
}
