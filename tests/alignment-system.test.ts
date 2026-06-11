import { describe, it, expect } from 'vitest';
import {
  createDefaultAlignment,
  applyAlignmentDelta,
  getDominantAlignment,
} from '../src/game/systems/alignment-system';

describe('alignment-system', () => {
  it('creates zeroed alignment', () => {
    const a = createDefaultAlignment();
    expect(a.manipulator).toBe(0);
    expect(a.guardian).toBe(0);
    expect(a.tempter).toBe(0);
    expect(a.creator).toBe(0);
  });

  it('applies deltas correctly', () => {
    const a = createDefaultAlignment();
    const updated = applyAlignmentDelta(a, { guardian: 3, manipulator: 1 });
    expect(updated.guardian).toBe(3);
    expect(updated.manipulator).toBe(1);
    expect(updated.tempter).toBe(0);
  });

  it('accumulates multiple deltas', () => {
    let a = createDefaultAlignment();
    a = applyAlignmentDelta(a, { creator: 2 });
    a = applyAlignmentDelta(a, { creator: 3 });
    expect(a.creator).toBe(5);
  });

  it('returns dominant identity', () => {
    let a = createDefaultAlignment();
    a = applyAlignmentDelta(a, { guardian: 10, manipulator: 2 });
    expect(getDominantAlignment(a)).toBe('Guardian');
  });

  it('returns Unknown when all zero', () => {
    expect(getDominantAlignment(createDefaultAlignment())).toBe('Unknown');
  });
});
