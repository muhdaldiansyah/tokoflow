/**
 * Haptic feedback via navigator.vibrate().
 * Works on Chrome Android. Silently ignored on iOS/desktop.
 */

function vibrate(pattern: number | number[]) {
  try {
    navigator?.vibrate?.(pattern);
  } catch {
    // Silently fail — API unavailable
  }
}

/** Light tap — order created, status changed, payment marked */
export function hapticSuccess() {
  vibrate(50);
}

/** Medium tap — bulk action completed */
export function hapticAction() {
  vibrate(80);
}

/** Strong double-pulse — cancel, delete */
export function hapticDestructive() {
  vibrate([80, 50, 80]);
}
