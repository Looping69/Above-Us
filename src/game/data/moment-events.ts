import type { MomentEvent } from '../types/moment';

export const momentEvents: MomentEvent[] = [
  {
    id: 'first_connection',
    stage: 1,
    arcId: 'global_connection',
    title: 'First Connection',
    description:
      'Something shifts. They pause mid-thought, as if aware of a warmth they cannot name. A thread has formed — fragile, but real.',
    requirements: {
      minTrust: 5,
      minCuriosity: 4,
      maxResistance: 3,
    },
    outcome: {
      connectionDelta: { trust: 2, comfort: 1 },
      stateDelta: {},
      description: 'The connection deepens. They feel slightly less alone.',
    },
    tone: 'emotional',
  },
  {
    id: 'first_vulnerability',
    stage: 1,
    arcId: 'trust_arc',
    characterIds: ['lena', 'ethan'],
    title: 'First Vulnerability',
    description:
      'Their voice cracks during an ordinary moment. A guarded part of them surfaces, then lingers instead of retreating.',
    requirements: {
      minTrust: 6,
      minComfort: 6,
      maxResistance: 2,
      requiredState: {
        anxiety: 5,
      },
    },
    outcome: {
      connectionDelta: { trust: 1, comfort: 2, curiosity: 1 },
      stateDelta: { anxiety: -1 },
      description: 'They let themselves be seen for a moment, and the bond stabilizes.',
    },
    tone: 'emotional',
  },
  {
    id: 'shared_dream',
    stage: 1,
    arcId: 'aspiration_arc',
    characterIds: ['jay', 'maya'],
    title: 'Shared Dream',
    description:
      'A sudden idea blooms in them, vivid and magnetic. For a breath, your intent and their ambition move in rhythm.',
    requirements: {
      minTrust: 6,
      minCuriosity: 8,
      maxResistance: 3,
      minAlignment: {
        creator: 4,
      },
      requiredState: {
        ambition: 6,
      },
    },
    outcome: {
      connectionDelta: { curiosity: 2, trust: 1, attraction: 1 },
      stateDelta: { ambition: 1 },
      description: 'A new possibility takes root, reshaping how they imagine tomorrow.',
    },
    tone: 'revelation',
  },
  {
    id: 'breaking_point',
    stage: 2,
    arcId: 'trust_arc',
    characterIds: ['lena', 'zara'],
    title: 'Breaking Point',
    description:
      'Pressure peaks. Their routines fracture, and a decision must be made before momentum turns into collapse.',
    requirements: {
      minTrust: 4,
      maxResistance: 6,
      minAlignment: {
        manipulator: 3,
      },
      requiredState: {
        stress: 8,
      },
    },
    outcome: {
      connectionDelta: { dependence: 2, comfort: -1, resistance: 1 },
      stateDelta: { stress: -2, anxiety: 1 },
      description: 'They hold together, but now they lean harder on outside influence.',
    },
    tone: 'dramatic',
  },
];
