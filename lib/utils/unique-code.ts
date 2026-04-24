const MAX_CODE = 999;

/**
 * Generate a unique_code (1-999) avoiding collisions with existing codes.
 * Used to create unique transfer amounts for payment matching.
 */
export function generateUniqueCode(existingCodes: number[]): number {
  const usedSet = new Set(existingCodes);

  // If all 999 codes taken (near-impossible), fall back to random
  if (usedSet.size >= MAX_CODE) {
    return Math.floor(Math.random() * MAX_CODE) + 1;
  }

  let code: number;
  do {
    code = Math.floor(Math.random() * MAX_CODE) + 1;
  } while (usedSet.has(code));

  return code;
}
