/** Whether a first-try streak of this length earns a celebration: 5, 10, 20, then every 10. */
export function isCelebrated(streak: number): boolean {
  return streak === 5 || (streak >= 10 && streak % 10 === 0);
}

/** True when an answer just took the streak up to a celebrated length; a miss, a retry or a repeat never does. */
export function celebrates(before: number, after: number): boolean {
  return after > before && isCelebrated(after);
}
