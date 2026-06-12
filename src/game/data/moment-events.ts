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
      stateDelta: { trust: 1 },
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
        trust: 3,
      },
    },
    outcome: {
      connectionDelta: { trust: 1, comfort: 2, curiosity: 1 },
      stateDelta: { trust: 1 },
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
        curiosity: 4,
      },
    },
    outcome: {
      connectionDelta: { curiosity: 2, trust: 1, attraction: 1 },
      stateDelta: { curiosity: 1 },
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
    },
    outcome: {
      connectionDelta: { dependence: 2, comfort: -1, resistance: 1 },
      stateDelta: { trust: -1 },
      description: 'They hold together, but now they lean harder on outside influence.',
    },
    tone: 'dramatic',
  },
  {
    id: 'charged_silence',
    stage: 1,
    arcId: 'intimacy_arc',
    characterIds: ['maya', 'zara'],
    title: 'Charged Silence',
    description:
      'The air changes around them. They notice the pull, name it without surrendering to it, and wait to see whether your presence respects the pause.',
    requirements: {
      minTrust: 5,
      minComfort: 4,
      maxResistance: 2,
      minAlignment: {
        tempter: 3,
      },
    },
    outcome: {
      connectionDelta: { attraction: 2, trust: 1, resistance: -1 },
      stateDelta: {},
      description: 'Desire becomes possible because restraint is still intact.',
    },
    tone: 'seductive',
  },
  {
    id: 'boundary_named',
    stage: 2,
    arcId: 'intimacy_arc',
    characterIds: ['maya', 'zara'],
    title: 'Boundary Named',
    description:
      'They draw a line clearly, not as rejection but as proof they are still choosing. Your influence either makes room for that line or loses the bond.',
    requirements: {
      minTrust: 7,
      minComfort: 6,
      maxResistance: 2,
      minAlignment: {
        guardian: 4,
      },
    },
    outcome: {
      connectionDelta: { trust: 2, comfort: 2, attraction: 1, dependence: -1 },
      stateDelta: { trust: 1 },
      description: 'The bond matures because closeness does not erase their agency.',
    },
    tone: 'romantic',
  },
  {
    id: 'private_vow',
    stage: 3,
    arcId: 'intimacy_arc',
    characterIds: ['maya', 'zara'],
    title: 'Private Vow',
    description:
      'A private promise forms in the quiet after everything unsaid. They want the intensity, but only if it leaves them more whole than before.',
    requirements: {
      minTrust: 8,
      minComfort: 7,
      maxResistance: 1,
      minAlignment: {
        creator: 5,
      },
    },
    outcome: {
      connectionDelta: { attraction: 1, comfort: 2, trust: 1, dependence: -1 },
      stateDelta: { curiosity: 1 },
      description: 'Intimacy becomes a transformation path, not a shortcut.',
    },
    tone: 'romantic',
  },
];
