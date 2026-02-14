// src/components/game/FactoryResetDialog.jsx

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { Alert, AlertDescription } from '@components/ui/alert';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { usePrizeStore } from '@stores/usePrizeStore';
import { toast } from 'sonner';
import { Recycle, AlertTriangle } from 'lucide-react';

/**
 * Factory Reset Dialog Component
 * Reusable confirmation dialog for complete app reset
 *
 * Features:
 * - Self-contained state management (loading, error)
 * - Handles all factory reset logic internally (teams, prizes, game state)
 * - Optional success callback for custom navigation/actions
 * - Toast notifications on success/failure
 * - Comprehensive warning messages
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Callback to control dialog open state
 * @param {function} onSuccess - Optional callback fired after successful reset
 */
export default function FactoryResetDialog({ open, onOpenChange, onSuccess }) {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);

  const resetAppToFactoryDefaults = useGameStore(
    (state) => state.resetAppToFactoryDefaults,
  );
  const deleteAllTeamsFromFirebase = useTeamsStore(
    (state) => state.deleteAllTeamsFromFirebase,
  );
  const resetPrizesToDefault = usePrizeStore((state) => state.resetToDefault);

  /**
   * Handle factory reset confirmation
   * Orchestrates complete app reset in sequence:
   * 1. Delete all teams from Firebase
   * 2. Reset prize structure to defaults
   * 3. Complete factory reset (question sets + Firebase)
   */
  const handleFactoryReset = async () => {
    setIsResetting(true);
    setError(null);

    try {
      console.log('🏭 Starting factory reset process...');

      // 1. Delete all teams from Firebase (also clears local store)
      const teamsResult = await deleteAllTeamsFromFirebase();
      if (!teamsResult.success) {
        throw new Error('Failed to delete teams: ' + teamsResult.error);
      }

      // 2. Reset prize structure to defaults (also syncs to Firebase)
      const prizesResult = await resetPrizesToDefault();
      if (!prizesResult.success) {
        throw new Error(
          'Failed to reset prize structure: ' + prizesResult.error,
        );
      }

      // 3. Complete factory reset (clears question sets + resets Firebase)
      const resetResult = await resetAppToFactoryDefaults();
      if (!resetResult.success) {
        throw new Error('Failed to complete reset: ' + resetResult.error);
      }

      console.log('✅ Factory reset completed successfully');

      toast.success('Factory Reset Complete', {
        description: 'All app data has been cleared. Starting fresh!',
      });

      // Close dialog
      onOpenChange(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Factory reset failed:', err);
      setError(err.message);
      toast.error('Factory Reset Failed', {
        description: err.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isResetting) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Recycle className="w-5 h-5" />
            Reset App to Factory Defaults?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="font-semibold text-destructive">
                ⚠️ This action is IRREVERSIBLE and will permanently delete ALL
                app data:
              </p>
              <ul className="space-y-1 text-sm list-none">
                <li>• All teams (from both localStorage and Firebase)</li>
                <li>• All question sets (from localStorage)</li>
                <li>• Prize structure (reset to defaults in Firebase)</li>
                <li>• Game state (reset to defaults in Firebase)</li>
              </ul>
              <p className="font-semibold">
                The app will be reset to its initial state as if freshly
                installed.
              </p>
              <p className="text-xs text-muted-foreground">
                This is typically used before a new event or to completely start
                over.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleFactoryReset}
            disabled={isResetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isResetting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Resetting...
              </>
            ) : (
              <>
                <Recycle className="w-4 h-4 mr-2" />
                Reset to Factory Defaults
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
