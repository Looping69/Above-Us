import type { InfluenceAction } from '../types/influence';

export type CharacterEvolutionRules = {
  characterId: string;
  pathWeights: Record<string, 'guardian' | 'creator' | 'shadow'>;
};

function getDominantAxisForAction(action: InfluenceAction): 'guardian' | 'creator' | 'shadow' {
  const guardian = action.alignment.guardian ?? 0;
  const creator = action.alignment.creator ?? 0;
  const shadow = (action.alignment.manipulator ?? 0) + (action.alignment.tempter ?? 0);

  if (guardian > creator && guardian > shadow) return 'guardian';
  if (creator > guardian && creator > shadow) return 'creator';
  if (shadow > guardian && shadow > creator) return 'shadow';
  if (guardian >= creator) return 'guardian';
  if (creator >= shadow) return 'creator';
  return 'shadow';
}

/**
 * Per-character evolution rules determine which path is influenced by each axis.
 *
 * - Lena (Ambitious, anxious): Burnout via guardian/stress, Breakthrough via creator, Dependence via shadow
 * - Jay (Creative, free): Artist via creator, Lost via shadow, Dependent via guardian
 * - Maya (Social, insecure): Leader via creator+guardian balance, Obsessed via tempter, Burnout via stress
 * - Ethan (Logical, controlled): Opened via creator/tempter (emotional), Rigid via guardian (control), Dependent via shadow
 * - Zara (Intense, impulsive): Self-destruction via tempter, Awakening via creator+guardian, Obsession via shadow
 */
export const evolutionRulesByCharacter: Record<string, CharacterEvolutionRules> = {
  lena: {
    characterId: 'lena',
    pathWeights: {
      Burnout: 'guardian', // stress + comfort-seeking -> burnout
      Breakthrough: 'creator', // change + growth -> breakthrough
      Dependence: 'shadow', // dark influence -> leaning on others
    },
  },
  jay: {
    characterId: 'jay',
    pathWeights: {
      Artist: 'creator', // creative growth
      Lost: 'shadow', // manipulation/tempation -> disorientation
      Dependent: 'guardian', // comfort-seeking -> dependency
    },
  },
  maya: {
    characterId: 'maya',
    pathWeights: {
      Leader: 'creator', // building, creating community
      Obsessed: 'shadow', // intense focus, manipulation -> obsession
      Burnout: 'guardian', // emotional support seeking -> burnout from over-involvement
    },
  },
  ethan: {
    characterId: 'ethan',
    pathWeights: {
      Opened: 'creator', // creative + emotional (tempter opens emotions)
      Rigid: 'guardian', // reinforcing control & stability
      Dependent: 'shadow', // being influenced/manipulated
    },
  },
  zara: {
    characterId: 'zara',
    pathWeights: {
      'Self-destruction': 'shadow', // tempter (intensity) + manipulator = self-destructive spiral
      Awakening: 'creator', // real growth, real connection, real change
      Obsession: 'guardian', // comfort-seeking becomes obsession
    },
  },
};

export function getPathForAxisAndCharacter(
  characterId: string,
  axis: 'guardian' | 'creator' | 'shadow',
  fallbackPaths: string[]
): string {
  const rules = evolutionRulesByCharacter[characterId];
  if (!rules) {
    // Fallback to generic position-based mapping
    if (axis === 'guardian') return fallbackPaths[0] ?? 'Path 1';
    if (axis === 'creator') return fallbackPaths[1] ?? fallbackPaths[0] ?? 'Path 1';
    return fallbackPaths[2] ?? fallbackPaths[1] ?? fallbackPaths[0] ?? 'Path 1';
  }

  // Find the path that maps to this axis
  for (const [path, mappedAxis] of Object.entries(rules.pathWeights)) {
    if (mappedAxis === axis) return path;
  }

  // Fallback if no path maps to this axis (shouldn't happen if rules are well-defined)
  return fallbackPaths[0] ?? 'Path 1';
}

export function getActionAxisForCharacter(action: InfluenceAction): 'guardian' | 'creator' | 'shadow' {
  return getDominantAxisForAction(action);
}
