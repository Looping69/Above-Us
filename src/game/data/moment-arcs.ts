import type { MomentArcDefinition } from '../types/moment';

export const momentArcs: Record<string, MomentArcDefinition> = {
  global_connection: {
    id: 'global_connection',
    title: 'First Threads',
    description: 'The earliest signs that your presence is felt.',
    accentColor: '#7ec87e',
  },
  trust_arc: {
    id: 'trust_arc',
    title: 'Trust Under Pressure',
    description: 'Vulnerability and strain shape long-term reliance.',
    accentColor: '#5cb8e0',
  },
  aspiration_arc: {
    id: 'aspiration_arc',
    title: 'Shared Aspiration',
    description: 'Ambition and possibility align with your influence.',
    accentColor: '#e0a05c',
  },
};
