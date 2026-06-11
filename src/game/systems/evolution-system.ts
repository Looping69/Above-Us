import type { InfluenceAction } from '../types/influence';
import { getPathForAxisAndCharacter, getActionAxisForCharacter } from '../data/evolution-rules';

export const EVOLUTION_THRESHOLD = 10;

export type CharacterEvolutionProgress = {
  pathScores: Record<string, number>;
  dominantPath: string | null;
  evolvedPath: string | null;
};

function getDominantInfluenceAxis(action: InfluenceAction): 'guardian' | 'creator' | 'shadow' {
  return getActionAxisForCharacter(action);
}

function getPathNameByAxisAndCharacter(
  characterId: string,
  axis: 'guardian' | 'creator' | 'shadow',
  paths: string[]
): string {
  return getPathForAxisAndCharacter(characterId, axis, paths);
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
  characterId: string,
  paths: string[],
  current: CharacterEvolutionProgress,
  action: InfluenceAction
): CharacterEvolutionProgress {
  const axis = getDominantInfluenceAxis(action);
  const influencedPath = getPathNameByAxisAndCharacter(characterId, axis, paths);

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
