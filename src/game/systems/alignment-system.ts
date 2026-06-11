import type { PlayerAlignment } from '../types/alignment';

export function createDefaultAlignment(): PlayerAlignment {
  return { manipulator: 0, guardian: 0, tempter: 0, creator: 0 };
}

export function applyAlignmentDelta(
  current: PlayerAlignment,
  delta: Partial<PlayerAlignment>
): PlayerAlignment {
  return {
    manipulator: current.manipulator + (delta.manipulator ?? 0),
    guardian: current.guardian + (delta.guardian ?? 0),
    tempter: current.tempter + (delta.tempter ?? 0),
    creator: current.creator + (delta.creator ?? 0),
  };
}

export function getDominantAlignment(alignment: PlayerAlignment): string {
  const entries = Object.entries(alignment) as [keyof PlayerAlignment, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (top[1] === 0) return 'Unknown';
  const labels: Record<keyof PlayerAlignment, string> = {
    manipulator: 'Manipulator',
    guardian: 'Guardian',
    tempter: 'Tempter',
    creator: 'Creator',
  };
  return labels[top[0]];
}
