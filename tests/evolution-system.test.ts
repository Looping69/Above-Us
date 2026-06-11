import { describe, it, expect } from 'vitest';
import { influenceActions } from '../src/game/data/influence-actions';
import {
  EVOLUTION_THRESHOLD,
  applyEvolutionInfluence,
  createInitialEvolutionProgress,
} from '../src/game/systems/evolution-system';

describe('evolution-system', () => {
  const paths = ['Burnout', 'Breakthrough', 'Dependence'];

  it('creates zeroed path scores for all evolution paths', () => {
    const initial = createInitialEvolutionProgress(paths);
    expect(initial.pathScores.Burnout).toBe(0);
    expect(initial.pathScores.Breakthrough).toBe(0);
    expect(initial.pathScores.Dependence).toBe(0);
    expect(initial.evolvedPath).toBeNull();
  });

  it('maps guardian-aligned action to first path', () => {
    const action = influenceActions.find((a) => a.id === 'steady_presence')!;
    const initial = createInitialEvolutionProgress(paths);
    const next = applyEvolutionInfluence(paths, initial, action);

    expect(next.pathScores.Burnout).toBe(1);
    expect(next.pathScores.Breakthrough).toBe(0);
    expect(next.pathScores.Dependence).toBe(0);
    expect(next.dominantPath).toBe('Burnout');
  });

  it('maps creator-aligned action to second path', () => {
    const action = influenceActions.find((a) => a.id === 'spark_change')!;
    const initial = createInitialEvolutionProgress(paths);
    const next = applyEvolutionInfluence(paths, initial, action);

    expect(next.pathScores.Breakthrough).toBe(1);
  });

  it('evolves once threshold is reached and keeps evolved path stable', () => {
    const action = influenceActions.find((a) => a.id === 'amplify_emotion')!;
    let current = createInitialEvolutionProgress(paths);

    for (let i = 0; i < EVOLUTION_THRESHOLD; i += 1) {
      current = applyEvolutionInfluence(paths, current, action);
    }

    expect(current.evolvedPath).toBe('Dependence');

    const guardianAction = influenceActions.find((a) => a.id === 'steady_presence')!;
    const after = applyEvolutionInfluence(paths, current, guardianAction);
    expect(after.evolvedPath).toBe('Dependence');
  });
});
