// src/pages/play/components/dialogs/SkipQuestionDialog.jsx

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
import { SkipForward, AlertTriangle } from 'lucide-react';

/**
 * SkipQuestionDialog Component
 *
 * Purpose: Confirmation dialog before skipping a question.
 * Replaces the native window.confirm() call previously in useGameControls.
 *
 * Behaviours:
 * - Warns that the action cannot be undone
 * - Notes that no prize credit is awarded for skipped questions
 * - If it's the last question, warns the team will be marked completed
 *
 * @param {boolean}  props.open           - Whether dialog is visible
 * @param {Function} props.onOpenChange   - Toggle open state
 * @param {Function} props.onConfirm      - Called when host confirms skip
 * @param {boolean}  props.isLastQuestion - Show extra warning if this is the final question
 * @param {boolean}  props.isLoading      - Disable confirm while processing
 */
export default function SkipQuestionDialog({
  open,
  onOpenChange,
  onConfirm,
  isLastQuestion = false,
  isLoading = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <SkipForward className="w-5 h-5 text-orange-500" />
            Skip This Question?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                This action{' '}
                <strong className="text-foreground">cannot be undone</strong>.
                The team will not receive any prize credit for skipping.
              </p>
              {isLastQuestion && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-xs">
                    This is the team&apos;s <strong>last question</strong>.
                    Skipping it will mark them as completed with their current
                    prize.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white">
            <SkipForward className="w-4 h-4 mr-2" />
            {isLoading ? 'Skipping...' : 'Skip Question'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
