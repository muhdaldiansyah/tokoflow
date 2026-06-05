import { useRef, useCallback, useMemo } from "react";

interface UseSwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  disabled?: boolean;
  disableRight?: boolean;
}

const DEADZONE = 10;
const THRESHOLD = 80;
const DAMPING = 0.3;

export function useSwipeGesture({
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
  disableRight = false,
}: UseSwipeGestureOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const deltaX = useRef(0);
  const isActive = useRef(false);
  const didSwipe = useRef(false);
  const directionLocked = useRef<"horizontal" | "vertical" | null>(null);

  const applyTransform = useCallback((x: number, transition = false) => {
    const el = containerRef.current;
    if (!el) return;
    el.style.transform = x === 0 ? "" : `translateX(${x}px)`;
    el.style.transition = transition ? "transform 0.25s cubic-bezier(0.2, 0, 0, 1)" : "none";
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      deltaX.current = 0;
      isActive.current = true;
      directionLocked.current = null;
      didSwipe.current = false;
      // Capture pointer for reliable tracking
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [disabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive.current || disabled) return;

      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      // Lock direction after deadzone
      if (!directionLocked.current) {
        if (Math.abs(dx) < DEADZONE && Math.abs(dy) < DEADZONE) return;
        directionLocked.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }

      // Vertical scroll — abort swipe
      if (directionLocked.current === "vertical") {
        isActive.current = false;
        return;
      }

      // Horizontal swipe detected — cancel long-press
      didSwipe.current = true;

      let raw = dx;

      // Block right swipe if disabled
      if (disableRight && raw > 0) raw = 0;

      // Apply rubber-band dampening past threshold
      if (Math.abs(raw) > THRESHOLD) {
        const sign = raw > 0 ? 1 : -1;
        raw = sign * (THRESHOLD + (Math.abs(raw) - THRESHOLD) * DAMPING);
      }

      deltaX.current = raw;
      applyTransform(raw);
    },
    [disabled, disableRight, applyTransform]
  );

  const onPointerUp = useCallback(() => {
    if (!isActive.current) return;
    isActive.current = false;

    const dx = deltaX.current;

    if (Math.abs(dx) >= THRESHOLD) {
      if (dx > 0 && !disableRight && onSwipeRight) {
        onSwipeRight();
      } else if (dx < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Animate back to origin
    applyTransform(0, true);
    deltaX.current = 0;
  }, [disableRight, onSwipeRight, onSwipeLeft, applyTransform]);

  const onPointerCancel = useCallback(() => {
    isActive.current = false;
    applyTransform(0, true);
    deltaX.current = 0;
  }, [applyTransform]);

  // Suppress onClick if user swiped
  const onClick = useCallback((e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const direction = useMemo(() => {
    // This is a snapshot — used for render hints, not real-time tracking
    return deltaX.current > 0 ? "right" : deltaX.current < 0 ? "left" : null;
  }, []);

  return {
    containerRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave: onPointerCancel,
      onPointerCancel,
      onClickCapture: onClick,
    },
    isSwiping: didSwipe,
    direction,
  };
}
