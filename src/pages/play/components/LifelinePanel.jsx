// src/pages/play/components/LifelinePanel.jsx

import { useState } from 'react';
import { useLifelineManagement } from '../hooks/useLifelineManagement';
import { useGameStore } from '@stores/useGameStore';
import { useTeamsStore } from '@stores/useTeamsStore';
import { LIFELINE_TYPE } from '@constants/teamStates';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Phone, Scissors, AlertTriangle } from 'lucide-react';
import { cn } from '@lib/utils';
import PhoneAFriendDialog from './dialogs/PhoneAFriendDialog';
import LifelineConfirmDialog from './dialogs/LifelineConfirmDialog';

/**
 * Lifeline Panel Component
 *
 * Purpose: Display and manage team's available lifelines.
 *
 * WWBAM Rules:
 * - Lifelines are DECISION TOOLS (not safety nets)
 * - Must be used BEFORE locking answer
 * - ONE lifeline per question maximum
 * - Team chooses: Phone-a-Friend OR 50/50 (not both)
 *
 * Lifeline Types:
 * 1. Phone-a-Friend: Confirmation → game pauses → PhoneAFriendDialog with timer
 * 2. 50/50: Confirmation → two incorrect options removed
 *
 * States:
 * - Available: Button enabled, full color
 * - Used (globally): Button disabled, greyed out, with "Used" badge
 * - Used this question: Both buttons locked
 * - After answer locked: Both buttons disabled
 */
export default function LifelinePanel() {
  const [isResuming, setIsResuming] = useState(false);

  // ============================================================
  // LIFELINE MANAGEMENT HOOK
  // ============================================================

  const {
    isActivating,
    activationError,
    lifelineUsedThisQuestion,
    isPhoneAvailable,
    isFiftyFiftyAvailable,
    canUsePhone,
    canUseFiftyFifty,
    phoneTimer,
    activateFiftyFifty,
    activatePhoneAFriend,
    resumeFromPhoneAFriend,
  } = useLifelineManagement();

  // ============================================================
  // STORE STATE
  // ============================================================

  const activeLifeline = useGameStore((state) => state.activeLifeline);
  const currentTeamId = useGameStore((state) => state.currentTeamId);
  const currentTeam = useTeamsStore((state) => state.teams[currentTeamId]);

  const isPhoneActive = activeLifeline === 'phone-a-friend';

  // ============================================================
  // CONFIRMATION DIALOG STATE
  // ============================================================

  const [pendingLifeline, setPendingLifeline] = useState(null); // LIFELINE_TYPE | null

  const handlePhoneClick = () =>
    setPendingLifeline(LIFELINE_TYPE.PHONE_A_FRIEND);
  const handleFiftyFiftyClick = () =>
    setPendingLifeline(LIFELINE_TYPE.FIFTY_FIFTY);
  const handleConfirmCancel = () => setPendingLifeline(null);

  // ============================================================
  // ACTIVATION HANDLERS (called after confirmation)
  // ============================================================

  const handleConfirmActivation = async () => {
    const lifeline = pendingLifeline;
    setPendingLifeline(null); // Close confirm dialog first

    if (lifeline === LIFELINE_TYPE.PHONE_A_FRIEND) {
      const result = await activatePhoneAFriend();
      if (result.success) {
        console.log('📞 Phone-a-Friend activated');
      }
    } else if (lifeline === LIFELINE_TYPE.FIFTY_FIFTY) {
      const result = await activateFiftyFifty();
      if (result.success) {
        console.log('✂️ 50/50 activated:', result);
      }
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    const result = await resumeFromPhoneAFriend();
    if (!result.success) {
      console.error('Failed to resume from Phone-a-Friend:', result.error);
    }
    setIsResuming(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Lifelines</h3>
          {lifelineUsedThisQuestion && (
            <Badge variant="secondary" className="text-xs">
              1 Used This Question
            </Badge>
          )}
        </div>

        {/* Phone-a-Friend Button */}
        <Button
          onClick={handlePhoneClick}
          disabled={!canUsePhone || isActivating || isPhoneActive}
          variant={canUsePhone ? 'default' : 'outline'}
          size="lg"
          className={cn(
            'w-full h-auto p-4 transition-all',
            !isPhoneAvailable && 'opacity-50 cursor-not-allowed',
            canUsePhone && 'ring-2 ring-blue-500 hover:ring-blue-600',
          )}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold text-sm">Phone-a-Friend</p>
                <p className="text-xs opacity-80">
                  Call someone for help (3 min)
                </p>
              </div>
            </div>
            <div>
              {isPhoneActive && (
                <Badge variant="default" className="text-xs bg-blue-600">
                  Active
                </Badge>
              )}
              {!isPhoneActive && !isPhoneAvailable && (
                <Badge variant="destructive" className="text-xs">
                  Used
                </Badge>
              )}
              {!isPhoneActive &&
                isPhoneAvailable &&
                !canUsePhone &&
                lifelineUsedThisQuestion && (
                  <Badge variant="secondary" className="text-xs">
                    Locked
                  </Badge>
                )}
              {canUsePhone && (
                <Badge variant="default" className="text-xs bg-green-600">
                  Available
                </Badge>
              )}
            </div>
          </div>
        </Button>

        {/* 50/50 Button */}
        <Button
          onClick={handleFiftyFiftyClick}
          disabled={!canUseFiftyFifty || isActivating}
          variant={canUseFiftyFifty ? 'default' : 'outline'}
          size="lg"
          className={cn(
            'w-full h-auto p-4 transition-all',
            !isFiftyFiftyAvailable && 'opacity-50 cursor-not-allowed',
            canUseFiftyFifty && 'ring-2 ring-yellow-500 hover:ring-yellow-600',
          )}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Scissors className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold text-sm">50/50</p>
                <p className="text-xs opacity-80">
                  Remove two incorrect answers
                </p>
              </div>
            </div>
            <div>
              {!isFiftyFiftyAvailable && (
                <Badge variant="destructive" className="text-xs">
                  Used
                </Badge>
              )}
              {isFiftyFiftyAvailable &&
                !canUseFiftyFifty &&
                lifelineUsedThisQuestion && (
                  <Badge variant="secondary" className="text-xs">
                    Locked
                  </Badge>
                )}
              {canUseFiftyFifty && (
                <Badge variant="default" className="text-xs bg-green-600">
                  Available
                </Badge>
              )}
            </div>
          </div>
        </Button>

        {/* Error Alert */}
        {activationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {activationError}
            </AlertDescription>
          </Alert>
        )}

        {/* Info / Rule Reminders */}
        {!canUsePhone &&
          !canUseFiftyFifty &&
          !isActivating &&
          !isPhoneActive && (
            <Alert className="bg-muted/50">
              <AlertDescription className="text-xs text-muted-foreground text-center">
                {lifelineUsedThisQuestion
                  ? '⚠️ One lifeline per question. Answer locked after use.'
                  : !isPhoneAvailable && !isFiftyFiftyAvailable
                    ? '❌ All lifelines used'
                    : '🔒 Push question to display to enable lifelines'}
              </AlertDescription>
            </Alert>
          )}

        {(canUsePhone || canUseFiftyFifty) && (
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700">
            <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
              <strong>⚠️ WWBAM Rule:</strong> Use BEFORE locking answer. Choose
              ONE per question. Wrong answer after lock = elimination.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────── */}

      {/* Lifeline Confirmation — shown before activating either lifeline */}
      <LifelineConfirmDialog
        open={!!pendingLifeline}
        onOpenChange={handleConfirmCancel}
        onConfirm={handleConfirmActivation}
        lifelineType={pendingLifeline}
        isLoading={isActivating}
      />

      {/* Phone-a-Friend Active Dialog — rendered outside panel to avoid stacking */}
      <PhoneAFriendDialog
        open={isPhoneActive}
        contactNumber={currentTeam?.contact}
        phoneTimer={phoneTimer}
        onResume={handleResume}
        isResuming={isResuming}
      />
    </>
  );
}
