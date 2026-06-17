export function estimateOneRepMaxEpley(load: number, reps: number): number | null {
  if (load <= 0 || reps < 1 || reps > 12) return null;
  return Math.round(load * (1 + reps / 30) * 10) / 10;
}
