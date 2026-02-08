// src/pages/Home.jsx

import { useState } from 'react';
import SetupVerification from '@components/setup/SetupVerification';
import FirebaseTest from '@components/test/FirebaseTest';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';

export default function Home() {
  const [showFirebaseDebug, setShowFirebaseDebug] = useState(false);

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
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
