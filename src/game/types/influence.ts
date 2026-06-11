import type { PlayerAlignment } from './alignment';

export type InfluenceEffect = {
  target: 'state' | 'connection';
  key: string;
  delta: number;
};

export type InfluenceAction = {
  id: string;
  name: string;
  description: string;
  cost: number;
  alignment: Partial<PlayerAlignment>;
  validTargets: string[];
  effects: InfluenceEffect[];
};
