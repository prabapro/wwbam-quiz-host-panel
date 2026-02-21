// src/pages/play/components/dialogs/PhoneAFriendDialog.jsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Phone, Timer, CheckCircle2 } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * PhoneAFriendDialog Component
 *
 * Purpose: Host-facing dialog shown while Phone-a-Friend lifeline is active.
 *
 * Layout:
 * ┌─────────────────────────────────────┐
 * │ 📞 Phone-a-Friend                   │
 * ├─────────────────────────────────────┤
 * │  Call this number:                  │
 * │  +94 77 123 4567   [big, prominent] │
 * │                                     │
 * │  [Start Timer]  ← before timer      │
 * │                                     │
 * │   03:00  ← countdown (after start)  │
 * │  [━━━━━━━━━━━━━━━] progress bar     │
 * │                                     │
 * │  [Resume Game]  ← always visible    │
 * └─────────────────────────────────────┘
 *
 * Behaviours:
 * - Cannot be dismissed by clicking outside or pressing Escape
 * - "Start Timer" only visible before timer has started
 * - Countdown and progress bar appear after timer starts
 * - "Resume Game" is always available (host may end call early)
 * - Timer expiry auto-calls onResume (handled by usePhoneTimer in parent)
 *
 * @param {boolean}  props.open            - Whether dialog is visible
 * @param {string}   props.contactNumber   - Team's contact phone number
 * @param {Object}   props.phoneTimer      - Timer state from usePhoneTimer
 * @param {Function} props.onResume        - Called when host clicks "Resume Game"
 * @param {boolean}  props.isResuming      - Disable button while resuming
 */
export default function PhoneAFriendDialog({
  open,
  contactNumber,
  phoneTimer,
  onStartTimer,
  onResume,
  isResuming = false,
}) {
  const { display, hasStarted, hasExpired, progressPct } = phoneTimer;

  return (
    <Dialog
      open={open}
      // Prevent accidental dismiss — host must use "Resume Game"
      onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Phone className="w-5 h-5" />
            Phone-a-Friend
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Contact Number */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Call this number
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xl font-bold tracking-wide font-mono">
                {contactNumber || '—'}
              </span>
            </div>
          </div>

          {/* Timer Section */}
          <div className="space-y-3">
            {!hasStarted ? (
              /* ── PRE-TIMER ───────────────────────────────────────────────
                 Start Timer is the primary CTA.
                 Resume is secondary — available if contact is unreachable. */
              <div className="space-y-2">
                <Button
                  onClick={onStartTimer}
                  size="lg"
                  className="w-full gap-2">
                  <Timer className="w-4 h-4" />
                  Start Timer
                </Button>

                <Button
                  onClick={onResume}
                  disabled={isResuming}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  {isResuming ? 'Resuming...' : 'Resume Game (skip timer)'}
                </Button>
              </div>
            ) : (
              /* ── TIMER RUNNING / EXPIRED ─────────────────────────────────
                 Countdown takes centre stage.
                 Resume Game is the only action once timer is running. */
              <div className="space-y-4">
                {/* Countdown display */}
                <div className="space-y-2 text-center">
                  <div
                    className={cn(
                      'text-5xl font-bold font-mono tabular-nums',
                      hasExpired
                        ? 'text-red-600 dark:text-red-400'
                        : progressPct <= 25
                          ? 'text-orange-500 dark:text-orange-400'
                          : 'text-foreground',
                    )}>
                    {display}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-1000',
                        hasExpired
                          ? 'bg-red-500'
                          : progressPct <= 25
                            ? 'bg-orange-500'
                            : 'bg-blue-500',
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {hasExpired ? (
                    <Badge variant="destructive" className="text-xs">
                      Time&apos;s up
                    </Badge>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Time remaining
                    </p>
                  )}
                </div>

                {/* Resume — primary once timer is running */}
                <Button
                  onClick={onResume}
                  disabled={isResuming}
                  size="lg"
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white">
                  <CheckCircle2 className="w-4 h-4" />
                  {isResuming ? 'Resuming...' : 'Resume Game'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Game resumes automatically when the timer ends.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
