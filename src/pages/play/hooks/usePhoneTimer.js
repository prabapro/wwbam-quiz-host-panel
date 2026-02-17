// src/pages/play/hooks/usePhoneTimer.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { PHONE_A_FRIEND_DURATION_MINUTES } from '@constants/config';
import { formatTimerDisplay } from '@utils/gameplay/lifelineLogic';

const TOTAL_SECONDS = PHONE_A_FRIEND_DURATION_MINUTES * 60;

/**
 * usePhoneTimer Hook
 *
 * Purpose: Isolated countdown timer for the Phone-a-Friend lifeline.
 *
 * Design decisions:
 * - Timer is purely local UI state — never written to Firebase
 * - Only the start/end events trigger Firebase writes (handled by useLifelineManagement)
 * - Timer starts manually via start() — not on mount — giving host time to dial
 * - onExpire fires once when the countdown hits zero
 *
 * @param {Object}   options
 * @param {Function} options.onExpire - Callback fired when timer reaches 00:00
 *
 * @returns {Object} Timer state and controls
 * @returns {number}  returns.secondsRemaining - Current countdown value
 * @returns {boolean} returns.isRunning        - Whether timer is actively ticking
 * @returns {boolean} returns.hasStarted       - Whether start() has been called
 * @returns {boolean} returns.hasExpired       - Whether timer has reached zero
 * @returns {string}  returns.display          - Formatted MM:SS string
 * @returns {number}  returns.totalSeconds     - Full duration in seconds
 * @returns {number}  returns.progressPct      - 0–100, decreasing as time runs out
 * @returns {Function} returns.start           - Start the countdown (idempotent)
 * @returns {Function} returns.reset           - Reset to full duration and stop
 */
export function usePhoneTimer({ onExpire } = {}) {
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const intervalRef = useRef(null);

  // Keep onExpire stable without re-registering the interval
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Core tick effect — only runs while isRunning
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          // Fire expiry callback outside of state update
          setTimeout(() => onExpireRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  /**
   * Start the countdown.
   * Idempotent — calling again after already started has no effect.
   */
  const start = useCallback(() => {
    if (hasStarted) return;
    setHasStarted(true);
    setIsRunning(true);
    console.log(`⏱️ Phone-a-Friend timer started: ${TOTAL_SECONDS}s`);
  }, [hasStarted]);

  /**
   * Reset timer back to full duration and stop it.
   * Called after resume (manual or auto) to clean up state.
   */
  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setSecondsRemaining(TOTAL_SECONDS);
    setIsRunning(false);
    setHasStarted(false);
    console.log('⏱️ Phone-a-Friend timer reset');
  }, []);

  return {
    secondsRemaining,
    isRunning,
    hasStarted,
    hasExpired: hasStarted && secondsRemaining === 0,
    display: formatTimerDisplay(secondsRemaining),
    totalSeconds: TOTAL_SECONDS,
    progressPct: Math.round((secondsRemaining / TOTAL_SECONDS) * 100),
    start,
    reset,
  };
}
