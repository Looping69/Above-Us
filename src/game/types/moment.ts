import type { PlayerAlignment } from './alignment';
import type { CharacterConnection } from './character';

export type MomentRequirements = {
  minTrust?: number;
  minCuriosity?: number;
  minComfort?: number;
  maxResistance?: number;
  minAlignment?: Partial<PlayerAlignment>;
  requiredState?: Record<string, number>;
};

export type MomentOutcome = {
  connectionDelta: Partial<CharacterConnection>;
  stateDelta: Record<string, number>;
  description: string;
};

export type MomentTone =
  | 'emotional'
  | 'romantic'
  | 'dramatic'
  | 'seductive'
  | 'conflict'
  | 'revelation';

export type MomentArcDefinition = {
  id: string;
  title: string;
  description?: string;
  accentColor?: string;
};

export type MomentEvent = {
  id: string;
  stage: number;
  arcId: string;
  characterIds?: string[];
  title: string;
  description: string;
  requirements: MomentRequirements;
  outcome: MomentOutcome;
  tone: MomentTone;
};
