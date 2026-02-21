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
 * REFACTORED: Compact vertical layout for 1/4-width column.
 * Each lifeline is a stacked button: icon on top, label + badge below.
 *
 * WWBAM Rules:
 * - Lifelines are DECISION TOOLS (not safety nets)
 * - Must be used BEFORE locking answer
 * - ONE lifeline per question maximum
 * - Team chooses: Phone-a-Friend OR 50/50 (not both)
 *
 * States:
 * - Available: Button enabled, full color, green badge
 * - Active (Phone): Blue "Active" badge
 * - Used globally: Disabled, greyed out, red "Used" badge
 * - Used this question: Both locked, "Locked" badge
 * - After answer locked: Both disabled
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
    startPhoneTimer,
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

  const [pendingLifeline, setPendingLifeline] = useState(null);

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
    setPendingLifeline(null);

    if (lifeline === LIFELINE_TYPE.PHONE_A_FRIEND) {
      const result = await activatePhoneAFriend();
      if (result.success) console.log('📞 Phone-a-Friend activated');
    } else if (lifeline === LIFELINE_TYPE.FIFTY_FIFTY) {
      const result = await activateFiftyFifty();
      if (result.success) console.log('✂️ 50/50 activated:', result);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    const result = await resumeFromPhoneAFriend();
    if (!result.success)
      console.error('Failed to resume from Phone-a-Friend:', result.error);
    setIsResuming(false);
  };

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Resolve the status badge for a lifeline button
   */
  const getLifelineBadge = ({ isAvailable, isActive, canUse }) => {
    if (isActive)
      return (
        <Badge className="text-xs bg-blue-600 hover:bg-blue-600">Active</Badge>
      );
    if (!isAvailable)
      return (
        <Badge variant="destructive" className="text-xs">
          Used
        </Badge>
      );
    if (!canUse && lifelineUsedThisQuestion)
      return (
        <Badge variant="secondary" className="text-xs">
          Locked
        </Badge>
      );
    if (canUse)
      return (
        <Badge className="text-xs bg-green-600 hover:bg-green-600">
          Available
        </Badge>
      );
    return null;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div className="space-y-3">
        {/* "Used this question" indicator */}
        {lifelineUsedThisQuestion && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              1 Used This Question
            </Badge>
          </div>
        )}

        {/* ── Phone-a-Friend ──────────────────────────────────── */}
        <Button
          onClick={handlePhoneClick}
          disabled={!canUsePhone || isActivating || isPhoneActive}
          variant={canUsePhone ? 'default' : 'outline'}
          className={cn(
            'w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 transition-all',
            !isPhoneAvailable && 'opacity-50 cursor-not-allowed',
            canUsePhone && 'ring-2 ring-blue-500 hover:ring-blue-600',
          )}>
          <Phone className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold leading-tight text-center">
            Phone-a-Friend
          </span>
          {getLifelineBadge({
            isAvailable: isPhoneAvailable,
            isActive: isPhoneActive,
            canUse: canUsePhone,
          })}
        </Button>

        {/* ── 50/50 ───────────────────────────────────────────── */}
        <Button
          onClick={handleFiftyFiftyClick}
          disabled={!canUseFiftyFifty || isActivating}
          variant={canUseFiftyFifty ? 'default' : 'outline'}
          className={cn(
            'w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 transition-all',
            !isFiftyFiftyAvailable && 'opacity-50 cursor-not-allowed',
            canUseFiftyFifty && 'ring-2 ring-yellow-500 hover:ring-yellow-600',
          )}>
          <Scissors className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold leading-tight text-center">
            50 / 50
          </span>
          {getLifelineBadge({
            isAvailable: isFiftyFiftyAvailable,
            isActive: false,
            canUse: canUseFiftyFifty,
          })}
        </Button>

        {/* ── Error ───────────────────────────────────────────── */}
        {activationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {activationError}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Status / Rule Reminder ──────────────────────────── */}
        {!canUsePhone &&
          !canUseFiftyFifty &&
          !isActivating &&
          !isPhoneActive && (
            <Alert className="bg-muted/50">
              <AlertDescription className="text-xs text-muted-foreground text-center">
                {lifelineUsedThisQuestion
                  ? '⚠️ One lifeline per question.'
                  : !isPhoneAvailable && !isFiftyFiftyAvailable
                    ? '❌ All lifelines used'
                    : '🔒 Push question to display first'}
              </AlertDescription>
            </Alert>
          )}

        {(canUsePhone || canUseFiftyFifty) && (
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700">
            <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
              <strong>WWBAM:</strong> Use BEFORE locking. One per question.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────── */}

      <LifelineConfirmDialog
        open={!!pendingLifeline}
        onOpenChange={handleConfirmCancel}
        onConfirm={handleConfirmActivation}
        lifelineType={pendingLifeline}
        isLoading={isActivating}
      />

      <PhoneAFriendDialog
        open={isPhoneActive}
        contactNumber={currentTeam?.contact}
        phoneTimer={phoneTimer}
        onStartTimer={startPhoneTimer}
        onResume={handleResume}
        isResuming={isResuming}
      />
    </>
  );
}
