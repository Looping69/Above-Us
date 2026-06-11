import { beforeEach, describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { useGameStore } from '../src/ui/stores/useGameStore';
import { influenceActions } from '../src/game/data/influence-actions';
import { momentEvents } from '../src/game/data/moment-events';
import type { InfluenceAction } from '../src/game/types/influence';
import type { MomentEvent } from '../src/game/types/moment';

type FuzzTarget = {
  momentId: string;
  characterId: string;
  weightedActionIds: string[];
  minSteps: number;
  maxSteps: number;
  minSuccessRate: number;
};

type SequenceResult = {
  unlocked: boolean;
  actionHistory: string[];
};

type TargetDiagnostics = {
  targetLabel: string;
  overallSuccessRate: number;
  seedSuccessRates: Record<number, number>;
  topActionMixes: Array<{ actionId: string; usageRate: number }>;
};

type DiagnosticsArtifact = {
  generatedAt: string;
  seeds: number[];
  attemptsPerSeed: number;
  targets: TargetDiagnostics[];
};

type Rng = {
  next: () => number;
};

function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 0x100000000;
    },
  };
}

function randomInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  return Math.floor(rng.next() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

function shouldPrintDiagnostics(): boolean {
  return process.env.ABOVE_US_FUZZ_DIAGNOSTICS === '1';
}

function shouldWriteDiagnosticsArtifact(): boolean {
  return process.env.ABOVE_US_FUZZ_DIAGNOSTICS_ARTIFACT === '1';
}

function getDiagnosticsArtifactPath(): string {
  return process.env.ABOVE_US_FUZZ_DIAGNOSTICS_PATH ?? 'artifacts/moment-fuzz-diagnostics.json';
}

function summarizeTopActionMixes(sequences: string[][]): Array<{ actionId: string; usageRate: number }> {
  if (sequences.length === 0) return [];

  const counts = new Map<string, number>();
  let totalActions = 0;
  for (const sequence of sequences) {
    for (const actionId of sequence) {
      counts.set(actionId, (counts.get(actionId) ?? 0) + 1);
      totalActions += 1;
    }
  }

  if (totalActions === 0) return [];

  return Array.from(counts.entries())
    .map(([actionId, count]) => ({ actionId, usageRate: count / totalActions }))
    .sort((a, b) => b.usageRate - a.usageRate)
    .slice(0, 3);
}

function maybePrintDiagnostics(rows: TargetDiagnostics[]): void {
  if (!shouldPrintDiagnostics() || rows.length === 0) return;

  console.info('--- Above Us Moment Fuzz Diagnostics ---');
  for (const row of rows) {
    const seedRates = Object.entries(row.seedSuccessRates)
      .map(([seed, rate]) => `${seed}:${rate.toFixed(3)}`)
      .join(' ');
    const mixes = row.topActionMixes
      .map((item) => `${item.actionId}:${item.usageRate.toFixed(3)}`)
      .join(' ');

    console.info(
      `${row.targetLabel} overall=${row.overallSuccessRate.toFixed(3)} seeds=[${seedRates}] topMixes=[${mixes}]`
    );
  }
}

async function maybeWriteDiagnosticsArtifact(artifact: DiagnosticsArtifact): Promise<void> {
  if (!shouldWriteDiagnosticsArtifact()) return;
  const artifactPath = getDiagnosticsArtifactPath();
  const directory = dirname(artifactPath);

  await mkdir(directory, { recursive: true });
  await writeFile(artifactPath, JSON.stringify(artifact, null, 2), 'utf8');
}

function addWeightedAction(
  bucket: string[],
  actionById: Record<string, InfluenceAction>,
  actionId: string,
  count: number
): void {
  if (!actionById[actionId]) return;
  for (let i = 0; i < count; i += 1) {
    bucket.push(actionId);
  }
}

function buildWeightedActions(moment: MomentEvent): string[] {
  const actionById = Object.fromEntries(influenceActions.map((a) => [a.id, a]));
  const weighted: string[] = [];

  // Base exploration pool favours low-risk progression actions.
  addWeightedAction(weighted, actionById, 'nudge_thought', 1);
  addWeightedAction(weighted, actionById, 'steady_presence', 1);
  addWeightedAction(weighted, actionById, 'spark_change', 1);

  const req = moment.requirements;
  if (req.minTrust !== undefined || req.minComfort !== undefined || req.maxResistance !== undefined) {
    addWeightedAction(weighted, actionById, 'steady_presence', 3);
  }

  if (req.minCuriosity !== undefined || req.requiredState?.curiosity !== undefined) {
    addWeightedAction(weighted, actionById, 'nudge_thought', 2);
    addWeightedAction(weighted, actionById, 'spark_change', 2);
  }

  if (req.requiredState?.trust !== undefined) {
    addWeightedAction(weighted, actionById, 'steady_presence', 2);
  }

  if (req.maxResistance === undefined) {
    addWeightedAction(weighted, actionById, 'amplify_emotion', 1);
  }

  if (req.minAlignment?.manipulator !== undefined) {
    addWeightedAction(weighted, actionById, 'nudge_thought', 3);
  }
  if (req.minAlignment?.guardian !== undefined) {
    addWeightedAction(weighted, actionById, 'steady_presence', 3);
  }
  if (req.minAlignment?.creator !== undefined) {
    addWeightedAction(weighted, actionById, 'spark_change', 5);
    addWeightedAction(weighted, actionById, 'nudge_thought', 2);
  }
  if (req.minAlignment?.tempter !== undefined) {
    addWeightedAction(weighted, actionById, 'amplify_emotion', 3);
  }

  return weighted;
}

function deriveScopedFuzzTargets(moments: MomentEvent[]): FuzzTarget[] {
  return moments.flatMap((moment) => {
    const ids = moment.characterIds ?? [];
    return ids.map((characterId) => {
      const stageAdjustment = Math.max(0, moment.stage - 1);
      return {
        momentId: moment.id,
        characterId,
        weightedActionIds: buildWeightedActions(moment),
        minSteps: 6 + stageAdjustment * 2,
        maxSteps: 14 + stageAdjustment * 6,
        minSuccessRate: 0.1,
      };
    });
  });
}

function runRandomSequence(target: FuzzTarget, rng: Rng): SequenceResult {
  useGameStore.getState().resetGame();
  useGameStore.setState({
    focusedCharacterId: target.characterId,
    attention: 80,
    maxAttention: 80,
    activeMoment: null,
  });

  const totalSteps = randomInt(rng, target.minSteps, target.maxSteps);
  const actionHistory: string[] = [];

  for (let i = 0; i < totalSteps; i += 1) {
    const randomActionId =
      target.weightedActionIds[randomInt(rng, 0, target.weightedActionIds.length - 1)];
    const action = influenceActions.find((item) => item.id === randomActionId);
    if (!action) {
      throw new Error(`Missing action for fuzz test: ${randomActionId}`);
    }

    actionHistory.push(randomActionId);
    useGameStore.getState().applyAction(action, target.characterId);
    if (useGameStore.getState().triggeredMoments.has(target.momentId)) {
      return { unlocked: true, actionHistory };
    }
  }

  return { unlocked: false, actionHistory };
}

describe('moment path fuzz', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('keeps every scoped moment-character pair reachable above a minimum success rate', async () => {
    const fuzzTargets = deriveScopedFuzzTargets(momentEvents);
    expect(fuzzTargets.length).toBeGreaterThan(0);

    const seeds = [20260611, 20260612, 20260613, 20260614];
    const attemptsPerSeed = 12;
    const diagnostics: TargetDiagnostics[] = [];

    for (const target of fuzzTargets) {
      let successes = 0;
      const totalAttempts = seeds.length * attemptsPerSeed;
      const successfulActionHistories: string[][] = [];
      const seedSuccessRates: Record<number, number> = {};

      for (const seed of seeds) {
        const rng = createRng(seed);
        let seedSuccesses = 0;
        for (let attempt = 0; attempt < attemptsPerSeed; attempt += 1) {
          const result = runRandomSequence(target, rng);
          if (result.unlocked) {
            successes += 1;
            seedSuccesses += 1;
            successfulActionHistories.push(result.actionHistory);
          }
        }
        seedSuccessRates[seed] = seedSuccesses / attemptsPerSeed;
      }

      const successRate = successes / totalAttempts;
      diagnostics.push({
        targetLabel: `${target.momentId} (${target.characterId})`,
        overallSuccessRate: successRate,
        seedSuccessRates,
        topActionMixes: summarizeTopActionMixes(successfulActionHistories),
      });

      expect(
        successRate,
        `Expected ${target.momentId} (${target.characterId}) to meet min success rate ${target.minSuccessRate}; got ${successRate.toFixed(3)}`
      ).toBeGreaterThanOrEqual(target.minSuccessRate);
    }

    maybePrintDiagnostics(diagnostics);

    await maybeWriteDiagnosticsArtifact({
      generatedAt: new Date().toISOString(),
      seeds,
      attemptsPerSeed,
      targets: diagnostics,
    });
  });
});
