import type { InfluenceAction } from '../types/influence';

export const EVOLUTION_THRESHOLD = 10;

export type CharacterEvolutionProgress = {
  pathScores: Record<string, number>;
  dominantPath: string | null;
  evolvedPath: string | null;
};

function getDominantInfluenceAxis(action: InfluenceAction): 'guardian' | 'creator' | 'shadow' {
  const guardian = action.alignment.guardian ?? 0;
  const creator = action.alignment.creator ?? 0;
  const shadow = (action.alignment.manipulator ?? 0) + (action.alignment.tempter ?? 0);

  if (guardian >= creator && guardian >= shadow) return 'guardian';
  if (creator >= guardian && creator >= shadow) return 'creator';
  return 'shadow';
}

function getPathNameByAxis(paths: string[], axis: 'guardian' | 'creator' | 'shadow'): string {
  if (axis === 'guardian') return paths[0] ?? 'Path 1';
  if (axis === 'creator') return paths[1] ?? paths[0] ?? 'Path 1';
  return paths[2] ?? paths[1] ?? paths[0] ?? 'Path 1';
}

export function createInitialEvolutionProgress(paths: string[]): CharacterEvolutionProgress {
  const pathScores: Record<string, number> = {};
  for (const path of paths) {
    pathScores[path] = 0;
  }

  return {
    pathScores,
    dominantPath: paths[0] ?? null,
    evolvedPath: null,
  };
}

export function applyEvolutionInfluence(
  paths: string[],
  current: CharacterEvolutionProgress,
  action: InfluenceAction
): CharacterEvolutionProgress {
  const axis = getDominantInfluenceAxis(action);
  const influencedPath = getPathNameByAxis(paths, axis);

  const pathScores = { ...current.pathScores };
  if (pathScores[influencedPath] === undefined) {
    pathScores[influencedPath] = 0;
  }
  pathScores[influencedPath] += 1;

  let dominantPath: string | null = null;
  let dominantScore = -1;
  for (const [path, score] of Object.entries(pathScores)) {
    if (score > dominantScore) {
      dominantScore = score;
      dominantPath = path;
    }
  }

  const evolvedPath =
    current.evolvedPath ?? (dominantPath !== null && dominantScore >= EVOLUTION_THRESHOLD ? dominantPath : null);

  return {
    pathScores,
    dominantPath,
    evolvedPath,
  };
}
