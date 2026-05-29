import { useEffect, useRef, useState, useCallback } from 'react';
import type { DegreeOfSuccess, MinigameCompleteCallback } from './types';

export function useMinigameTimer(duration: number) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const doneRef = useRef(false);

  // Recursive-timeout pattern: schedules itself each tick, stops when timeLeft hits 0.
  // Clean to unmount: the cleanup cancels the pending timeout.
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = window.setTimeout(() => {
      setTimeLeft(prev => Math.max(0, prev - 100));
    }, 100);
    return () => clearTimeout(id);
  }, [timeLeft]);

  // Idempotent reporter: first call wins, subsequent calls are no-ops.
  const report = useCallback(
    (degree: DegreeOfSuccess, onComplete: MinigameCompleteCallback) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onComplete(degree);
    },
    []
  );

  return { timeLeft, doneRef, report };
}
