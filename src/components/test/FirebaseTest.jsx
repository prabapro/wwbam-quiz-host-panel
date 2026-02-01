// src/components/test/FirebaseTest.jsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { CheckCircle2, XCircle, Database, Wifi } from 'lucide-react';
import { databaseService } from '@services/database.service';
import { useAuth } from '@hooks/useAuth';

/**
 * Firebase Test Component
 * Tests database connectivity and read/write operations
 * For development/testing purposes only
 */
export default function FirebaseTest() {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState({
    read: null,
    write: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState(null);

  // Test database read
  const testRead = async () => {
    setIsLoading(true);
    try {
      const data = await databaseService.getGameState();
      setGameState(data);
      setTestResults((prev) => ({ ...prev, read: true }));
      console.log('✅ Read test passed:', data);
    } catch (error) {
      setTestResults((prev) => ({ ...prev, read: false }));
      console.error('❌ Read test failed:', error);
    }
    setIsLoading(false);
  };

  // Test database write (requires authentication)
  const testWrite = async () => {
    if (!isAuthenticated) {
      alert('Please login to test write operations');
      return;
    }

    setIsLoading(true);
    try {
      await databaseService.updateGameState({
        'game-status': 'testing',
        'test-timestamp': Date.now(),
      });
      setTestResults((prev) => ({ ...prev, write: true }));
      console.log('✅ Write test passed');

      // Re-read to verify
      await testRead();
    } catch (error) {
      setTestResults((prev) => ({ ...prev, write: false }));
      console.error('❌ Write test failed:', error);
    }
    setIsLoading(false);
  };

  // Auto-test read on mount
  useEffect(() => {
    testRead();
  }, []);

  const TestBadge = ({ result, label }) => {
    if (result === null) {
      return <Badge variant="outline">{label}: Not tested</Badge>;
    }
    return result ? (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {label}: Pass
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        {label}: Fail
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Firebase Integration Test</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Firebase Status</span>
          </div>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Connected
          </Badge>
        </div>

        {/* Auth Status */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Authentication</span>
          </div>
          {isAuthenticated ? (
            <div className="text-right">
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                Authenticated
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.email}
              </p>
            </div>
          ) : (
            <Badge variant="outline">Not logged in</Badge>
          )}
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Test Results</h4>
          <div className="flex flex-wrap gap-2">
            <TestBadge result={testResults.read} label="Read" />
            <TestBadge result={testResults.write} label="Write" />
          </div>
        </div>

        {/* Game State Preview */}
        {gameState && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Game State</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(gameState, null, 2)}
            </pre>
          </div>
        )}

        {/* Test Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={testRead}
            disabled={isLoading}
            variant="outline"
            size="sm">
            Test Read
          </Button>
          <Button
            onClick={testWrite}
            disabled={isLoading || !isAuthenticated}
            size="sm">
            Test Write
          </Button>
        </div>

        {/* Warning */}
        {!isAuthenticated && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Login required to test write operations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
