// src/pages/Home.jsx

import { useState, useEffect } from 'react';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import SetupVerification from '@components/setup/SetupVerification';
import FirebaseTest from '@components/test/FirebaseTest';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';

export default function Home() {
  const [showFirebaseDebug, setShowFirebaseDebug] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Get loading states from both stores
  const teamsLoading = useTeamsStore((state) => state.isLoading);
  const prizesLoading = usePrizeStore((state) => state.isLoading);

  // Track if initial data load is happening
  const isLoadingInitialData = teamsLoading || prizesLoading;

  // Effect to track when initial loading is complete
  useEffect(() => {
    // Once both stores have finished loading, mark initial load as complete
    if (!teamsLoading && !prizesLoading && !initialLoadComplete) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [teamsLoading, prizesLoading, initialLoadComplete]);

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl space-y-8 relative">
      {/* Loading Overlay with Blur Effect */}
      {isLoadingInitialData && !initialLoadComplete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-lg shadow-lg border">
            <LoadingSpinner
              size="lg"
              text="Loading setup data..."
              variant="primary"
            />
            <p className="text-sm text-muted-foreground text-center mt-4">
              Syncing teams and prize structure from Firebase
            </p>
          </div>
        </div>
      )}

      {/* Setup Verification Dashboard */}
      <div className="max-w-4xl mx-auto">
        <SetupVerification />
      </div>

      {/* Firebase Integration Debug (Collapsible) */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowFirebaseDebug(!showFirebaseDebug)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base">
                  Firebase Integration Debug
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                {showFirebaseDebug ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          {showFirebaseDebug && (
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Test Firebase read/write operations to verify database
                  connectivity. Check browser console for detailed logs.
                </p>
              </div>

              <FirebaseTest />
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
}
