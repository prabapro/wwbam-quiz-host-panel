// src/pages/play/components/dialogs/LifelineConfirmDialog.jsx

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
import { Phone, Scissors } from 'lucide-react';
import { LIFELINE_TYPE } from '@constants/teamStates';

/**
 * Lifeline config map — keeps content DRY and co-located
 */
const LIFELINE_CONFIG = {
  [LIFELINE_TYPE.PHONE_A_FRIEND]: {
    icon: Phone,
    label: 'Phone-a-Friend',
    iconClass: 'text-blue-500',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    description:
      'The game will be paused and the team can call their designated contact for help. The lifeline will be permanently marked as used.',
    consequence:
      'Game pauses. Timer starts when you click "Start Timer" in the next dialog.',
  },
  [LIFELINE_TYPE.FIFTY_FIFTY]: {
    icon: Scissors,
    label: '50/50',
    iconClass: 'text-yellow-500',
    actionClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    description:
      'Two incorrect answer options will be removed, leaving the correct answer and one incorrect option. This cannot be reversed.',
    consequence: 'Public display updates immediately to show only 2 options.',
  },
};

/**
 * LifelineConfirmDialog Component
 *
 * Purpose: Confirmation dialog before activating either lifeline.
 * Lifelines are permanently marked as used in Firebase — this prevents
 * accidental activation.
 *
 * @param {boolean}  props.open          - Whether dialog is visible
 * @param {Function} props.onOpenChange  - Toggle open state
 * @param {Function} props.onConfirm     - Called when host confirms activation
 * @param {string}   props.lifelineType  - LIFELINE_TYPE constant
 * @param {boolean}  props.isLoading     - Disable confirm while processing
 */
export default function LifelineConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  lifelineType,
  isLoading = false,
}) {
  const config = LIFELINE_CONFIG[lifelineType];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.iconClass}`} />
            Use {config.label}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{config.description}</p>
              <div className="p-3 rounded-md bg-muted text-xs text-foreground">
                <strong>What happens next:</strong> {config.consequence}
              </div>
              <p className="text-xs">
                This lifeline will be{' '}
                <strong className="text-foreground">permanently used</strong>{' '}
                and cannot be restored for this team.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={config.actionClass}>
            <Icon className="w-4 h-4 mr-2" />
            {isLoading ? 'Activating...' : `Use ${config.label}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
