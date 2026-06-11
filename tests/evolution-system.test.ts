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

  it('maps guardian-aligned action to first path for unknown character', () => {
    const action = influenceActions.find((a) => a.id === 'steady_presence')!;
    const initial = createInitialEvolutionProgress(paths);
    const next = applyEvolutionInfluence('unknown', paths, initial, action);

    expect(next.pathScores.Burnout).toBe(1);
    expect(next.dominantPath).toBe('Burnout');
  });

  it('maps guardian to Burnout for Lena', () => {
    const action = influenceActions.find((a) => a.id === 'steady_presence')!;
    const lenaPaths = ['Burnout', 'Breakthrough', 'Dependence'];
    const initial = createInitialEvolutionProgress(lenaPaths);
    const next = applyEvolutionInfluence('lena', lenaPaths, initial, action);

    expect(next.pathScores.Burnout).toBe(1);
    expect(next.dominantPath).toBe('Burnout');
  });

  it('maps creator to Breakthrough for Lena', () => {
    const action = influenceActions.find((a) => a.id === 'spark_change')!;
    const lenaPaths = ['Burnout', 'Breakthrough', 'Dependence'];
    const initial = createInitialEvolutionProgress(lenaPaths);
    const next = applyEvolutionInfluence('lena', lenaPaths, initial, action);

    expect(next.pathScores.Breakthrough).toBe(1);
  });

  it('maps creator to Artist for Jay', () => {
    const action = influenceActions.find((a) => a.id === 'spark_change')!;
    const jayPaths = ['Artist', 'Lost', 'Dependent'];
    const initial = createInitialEvolutionProgress(jayPaths);
    const next = applyEvolutionInfluence('jay', jayPaths, initial, action);

    expect(next.pathScores.Artist).toBe(1);
  });

  it('maps shadow to Lost for Jay', () => {
    const action = influenceActions.find((a) => a.id === 'amplify_emotion')!;
    const jayPaths = ['Artist', 'Lost', 'Dependent'];
    const initial = createInitialEvolutionProgress(jayPaths);
    const next = applyEvolutionInfluence('jay', jayPaths, initial, action);

    expect(next.pathScores.Lost).toBe(1);
  });

  it('maps shadow to Self-destruction for Zara', () => {
    const action = influenceActions.find((a) => a.id === 'amplify_emotion')!;
    const zaraPaths = ['Self-destruction', 'Awakening', 'Obsession'];
    const initial = createInitialEvolutionProgress(zaraPaths);
    const next = applyEvolutionInfluence('zara', zaraPaths, initial, action);

    expect(next.pathScores['Self-destruction']).toBe(1);
  });

  it('evolves Lena to Breakthrough once threshold is reached', () => {
    const action = influenceActions.find((a) => a.id === 'spark_change')!;
    const lenaPaths = ['Burnout', 'Breakthrough', 'Dependence'];
    let current = createInitialEvolutionProgress(lenaPaths);

    for (let i = 0; i < EVOLUTION_THRESHOLD; i += 1) {
      current = applyEvolutionInfluence('lena', lenaPaths, current, action);
    }

    expect(current.evolvedPath).toBe('Breakthrough');
  });

  it('keeps evolved path stable after threshold', () => {
    const action = influenceActions.find((a) => a.id === 'spark_change')!;
    const lenaPaths = ['Burnout', 'Breakthrough', 'Dependence'];
    let current = createInitialEvolutionProgress(lenaPaths);

    for (let i = 0; i < EVOLUTION_THRESHOLD; i += 1) {
      current = applyEvolutionInfluence('lena', lenaPaths, current, action);
    }

    const guardianAction = influenceActions.find((a) => a.id === 'steady_presence')!;
    const after = applyEvolutionInfluence('lena', lenaPaths, current, guardianAction);
    expect(after.evolvedPath).toBe('Breakthrough');
  });
});
