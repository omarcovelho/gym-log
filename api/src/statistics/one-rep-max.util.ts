export function estimateOneRepMaxEpley(
  load: number,
  reps: number,
  rir?: number | null,
): number | null {
  const reserve = rir != null && rir > 0 ? rir : 0;
  const effectiveReps = reps + reserve;
  if (load <= 0 || effectiveReps < 1 || effectiveReps > 12) return null;
  return Math.round(load * (1 + effectiveReps / 30) * 10) / 10;
}
