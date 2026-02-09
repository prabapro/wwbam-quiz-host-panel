// src/pages/PrizeManagement.jsx

import { useState, useEffect } from 'react';
import { usePrizeStore } from '@stores/usePrizeStore';
import PrizeStructureEditor from '@components/prizes/PrizeStructureEditor';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PrizeManagement() {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadPrizeStructure = usePrizeStore((state) => state.loadPrizeStructure);
  const isLoading = usePrizeStore((state) => state.isLoading);
  const error = usePrizeStore((state) => state.error);

  // Load prize structure from Firebase on mount
  useEffect(() => {
    loadPrizeStructure();
  }, [loadPrizeStructure]);

  const handleSaveSuccess = () => {
    setSaveSuccess(true);

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 5000);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Prize Structure Management</h1>
        </div>
        <p className="text-muted-foreground">
          Configure prize values for each question level in the competition
        </p>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Saved Successfully</AlertTitle>
          <AlertDescription className="text-green-600">
            Prize structure has been synced to Firebase and will be used in the
            competition.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading prize structure...</p>
          </div>
        </div>
      ) : (
        /* Editor */
        <PrizeStructureEditor onSaveSuccess={handleSaveSuccess} />
      )}
    </div>
  );
}
