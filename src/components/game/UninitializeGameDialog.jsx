// src/components/game/UninitializeGameDialog.jsx

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
import { toast } from 'sonner';
import { RotateCcw, AlertTriangle } from 'lucide-react';

/**
 * Uninitialize Game Dialog Component
 * Reusable confirmation dialog for uninitializing the game
 *
 * Features:
 * - Self-contained state management (loading, error)
 * - Handles all uninitialize logic internally
 * - Optional success callback for custom navigation/actions
 * - Toast notifications on success/failure
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Callback to control dialog open state
 * @param {function} onSuccess - Optional callback fired after successful uninitialize
 */
export default function UninitializeGameDialog({
  open,
  onOpenChange,
  onSuccess,
}) {
  const [isUninitializing, setIsUninitializing] = useState(false);
  const [error, setError] = useState(null);

  const uninitializeGame = useGameStore((state) => state.uninitializeGame);

  /**
   * Handle uninitialize confirmation
   */
  const handleUninitialize = async () => {
    setIsUninitializing(true);
    setError(null);

    try {
      const result = await uninitializeGame();

      if (!result.success) {
        throw new Error(result.error || 'Failed to uninitialize');
      }

      console.log('🔄 Game uninitialized and synced to Firebase');

      toast.success('Game Uninitialized', {
        description: 'You can now reconfigure teams and reinitialize.',
      });

      // Close dialog
      onOpenChange(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to uninitialize:', err);
      setError(err.message);
      toast.error('Uninitialize Failed', {
        description: err.message,
      });
    } finally {
      setIsUninitializing(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isUninitializing) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-600" />
            Uninitialize Game?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This will reset the game to NOT_STARTED state and clear the play
                queue.
              </p>
              <p className="font-semibold">What will be kept:</p>
              <ul className="space-y-1 text-sm list-none">
                <li>✓ All teams</li>
                <li>✓ All question sets</li>
                <li>✓ Prize structure</li>
              </ul>
              <p className="font-semibold">What will be cleared:</p>
              <ul className="space-y-1 text-sm list-none">
                <li>✗ Play queue</li>
                <li>✗ Question set assignments</li>
                <li>✗ Current game progress</li>
              </ul>
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
          <AlertDialogCancel disabled={isUninitializing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUninitialize}
            disabled={isUninitializing}
            className="bg-orange-600 text-white hover:bg-orange-700">
            {isUninitializing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Uninitializing...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Uninitialize
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
