// src/components/teams/DeleteTeamDialog.jsx

import { useGameStore } from '@stores/useGameStore';
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
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { AlertTriangle, ShieldAlert, AlertCircle } from 'lucide-react';

export default function DeleteTeamDialog({
  team,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}) {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const isGameActive = gameStatus === 'active' || gameStatus === 'initialized';

  const handleConfirm = () => {
    if (!isGameActive && !isDeleting) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Team?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{team?.name}"</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning for active game */}
        {isGameActive && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Cannot Delete</AlertTitle>
            <AlertDescription>
              Teams cannot be deleted while the game is active or initialized.
              Please pause or reset the game first.
            </AlertDescription>
          </Alert>
        )}

        {/* Warning for deletion */}
        {!isGameActive && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The team and all associated data
              will be permanently removed from both Firebase and local storage.
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isGameActive || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? 'Deleting...' : 'Delete Team'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
