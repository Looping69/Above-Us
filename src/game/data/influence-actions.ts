import type { InfluenceAction } from '../types/influence';

export const influenceActions: InfluenceAction[] = [
  {
    id: 'nudge_thought',
    name: 'Nudge Thought',
    description: 'A subtle mental push. Low cost, barely noticed.',
    cost: 1,
    alignment: { manipulator: 2 },
    validTargets: ['all'],
    effects: [
      { target: 'state', key: 'curiosity', delta: 1 },
      { target: 'connection', key: 'curiosity', delta: 1 },
    ],
  },
  {
    id: 'amplify_emotion',
    name: 'Amplify Emotion',
    description: 'Intensifies their current emotional state. Risky.',
    cost: 3,
    alignment: { tempter: 2 },
    validTargets: ['all'],
    effects: [
      { target: 'connection', key: 'attraction', delta: 2 },
      { target: 'connection', key: 'resistance', delta: 1 },
    ],
  },
  {
    id: 'steady_presence',
    name: 'Steady Presence',
    description: 'Calms, protects, stabilises. A gentle guardian touch.',
    cost: 2,
    alignment: { guardian: 2 },
    validTargets: ['all'],
    effects: [
      { target: 'connection', key: 'trust', delta: 2 },
      { target: 'connection', key: 'comfort', delta: 2 },
      { target: 'connection', key: 'resistance', delta: -1 },
    ],
  },
  {
    id: 'spark_change',
    name: 'Spark Change',
    description: 'Encourages growth, curiosity, and transformation.',
    cost: 2,
    alignment: { creator: 2 },
    validTargets: ['all'],
    effects: [
      { target: 'connection', key: 'curiosity', delta: 2 },
      { target: 'connection', key: 'trust', delta: 1 },
    ],
  },
];
