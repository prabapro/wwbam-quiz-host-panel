// src/hooks/useCountdownButton.js

import { useState, useEffect } from 'react';

/**
 * useCountdownButton
 *
 * Reusable hook that gates a button behind a countdown timer.
 * Resets automatically each time the `open` flag flips to true,
 * so every dialog appearance starts a fresh countdown.
 *
 * Reset is handled via React's recommended derived-state pattern
 * (comparing prev vs current open during render) to avoid calling
 * setState synchronously inside an effect body.
 *
 * @param {boolean} open    - Whether the parent dialog is open
 * @param {number}  seconds - Countdown duration in seconds (default: 10)
 * @returns {{ isReady: boolean, secondsLeft: number }}
 *   - isReady:     true once countdown reaches 0 — button should be enabled
 *   - secondsLeft: remaining seconds (0 when ready)
 */
export function useCountdownButton(open, seconds = 10) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset countdown when dialog re-opens.
  // This is React's recommended pattern for deriving state from props —
  // calling setState during render (not inside an effect) causes an
  // immediate re-render with the new value before painting.
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setSecondsLeft(seconds);
    }
  }

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, seconds]);

  return {
    isReady: secondsLeft === 0,
    secondsLeft,
  };
}
