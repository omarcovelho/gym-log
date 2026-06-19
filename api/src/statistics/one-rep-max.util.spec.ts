import { estimateOneRepMaxEpley } from './one-rep-max.util';

describe('estimateOneRepMaxEpley', () => {
  it('estimates 1RM from load and reps only when RIR is omitted', () => {
    expect(estimateOneRepMaxEpley(100, 5)).toBe(116.7);
  });

  it('adds RIR to reps for effective rep count', () => {
    // 100 kg × 5 @ RIR 2 → Epley(100, 7)
    expect(estimateOneRepMaxEpley(100, 5, 2)).toBe(123.3);
  });

  it('treats null or zero RIR like reps-only estimate', () => {
    expect(estimateOneRepMaxEpley(100, 5, null)).toBe(116.7);
    expect(estimateOneRepMaxEpley(100, 5, 0)).toBe(116.7);
  });

  it('ignores negative RIR values', () => {
    expect(estimateOneRepMaxEpley(100, 5, -1)).toBe(116.7);
  });

  it('returns null when effective reps fall outside 1–12', () => {
    expect(estimateOneRepMaxEpley(100, 10, 3)).toBeNull();
    expect(estimateOneRepMaxEpley(100, 0)).toBeNull();
  });
});
