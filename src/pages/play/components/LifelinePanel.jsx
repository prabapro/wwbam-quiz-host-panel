// src/pages/play/components/LifelinePanel.jsx

import { useLifelineManagement } from '../hooks/useLifelineManagement';
import { useGameStore } from '@stores/useGameStore';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Phone, Scissors, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Lifeline Panel Component
 *
 * Purpose: Display and manage team's available lifelines
 *
 * WWBAM Rules:
 * - Lifelines are DECISION TOOLS (not safety nets)
 * - Must be used BEFORE locking answer
 * - ONE lifeline per question maximum
 * - Team chooses: Phone-a-Friend OR 50/50 (not both)
 *
 * Lifeline Types:
 * 1. Phone-a-Friend: Team calls someone for help (3 minutes)
 * 2. 50/50: Remove two incorrect answers
 *
 * States:
 * - Available: Button enabled, full color
 * - Used (globally): Button disabled, greyed out, with X
 * - Used this question: Both buttons disabled
 * - After answer locked: Both buttons disabled
 */
export default function LifelinePanel() {
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
    activateFiftyFifty,
    activatePhoneAFriend,
    resumeFromPhoneAFriend,
  } = useLifelineManagement();

  // ============================================================
  // GAME STORE
  // ============================================================

  const activeLifeline = useGameStore((state) => state.activeLifeline);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handleFiftyFiftyClick = async () => {
    const result = await activateFiftyFifty();
    if (result.success) {
      console.log('50/50 activated:', result);
    }
  };

  const handlePhoneClick = async () => {
    const result = await activatePhoneAFriend();
    if (result.success) {
      console.log('Phone-a-Friend activated:', result);
    }
  };

  const handleResumeFromPhone = async () => {
    const result = await resumeFromPhoneAFriend();
    if (result.success) {
      console.log('Resumed from Phone-a-Friend');
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
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
        disabled={!canUsePhone || isActivating}
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
            {!isPhoneAvailable && (
              <Badge variant="destructive" className="text-xs">
                Used
              </Badge>
            )}
            {isPhoneAvailable && !canUsePhone && lifelineUsedThisQuestion && (
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
              <p className="text-xs opacity-80">Remove two incorrect answers</p>
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

      {/* Phone-a-Friend Active State */}
      {activeLifeline === 'phone-a-friend' && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
            <div className="flex items-center justify-between">
              <span>
                <strong>📞 Phone-a-Friend Active</strong>
                <br />
                Timer paused. Resume when call completes.
              </span>
              <Button
                onClick={handleResumeFromPhone}
                size="sm"
                variant="outline"
                className="ml-2">
                Resume
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {activationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {activationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Message */}
      {!canUsePhone && !canUseFiftyFifty && !isActivating && (
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

      {/* WWBAM Rule Reminder */}
      {(canUsePhone || canUseFiftyFifty) && (
        <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700">
          <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
            <strong>⚠️ WWBAM Rule:</strong> Use BEFORE locking answer. Choose
            ONE per question. Wrong answer after lock = elimination.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
