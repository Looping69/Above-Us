import { describe, it, expect } from 'vitest';
import {
  applyMomentOutcome,
  auditMissingRequiredStateKeys,
  checkMomentRequirements,
  getAvailableMoments,
} from '../src/game/systems/moment-system';
import { createDefaultAlignment } from '../src/game/systems/alignment-system';
import { createDefaultConnection } from '../src/game/systems/connection-system';
import { momentEvents } from '../src/game/data/moment-events';
import { characters } from '../src/game/data/characters';
import { influenceActions } from '../src/game/data/influence-actions';
import type { MomentEvent } from '../src/game/types/moment';

describe('moment-system', () => {
  it('first_connection requires trust >= 5, curiosity >= 4, resistance <= 3', () => {
    const moment = momentEvents.find((m) => m.id === 'first_connection')!;
    const conn = { ...createDefaultConnection(), trust: 5, curiosity: 4, resistance: 0 };
    expect(checkMomentRequirements(moment.requirements, conn, createDefaultAlignment(), {})).toBe(true);
  });

  it('blocks first_connection when trust is too low', () => {
    const moment = momentEvents.find((m) => m.id === 'first_connection')!;
    const conn = { ...createDefaultConnection(), trust: 4, curiosity: 4, resistance: 0 };
    expect(checkMomentRequirements(moment.requirements, conn, createDefaultAlignment(), {})).toBe(false);
  });

  it('blocks first_connection when resistance is too high', () => {
    const moment = momentEvents.find((m) => m.id === 'first_connection')!;
    const conn = { ...createDefaultConnection(), trust: 6, curiosity: 5, resistance: 4 };
    expect(checkMomentRequirements(moment.requirements, conn, createDefaultAlignment(), {})).toBe(false);
  });

  it('does not return already-triggered moments', () => {
    const conn = { ...createDefaultConnection(), trust: 10, curiosity: 10, resistance: 0 };
    const triggered = new Set(['first_connection']);
    const available = getAvailableMoments(momentEvents, triggered, conn, createDefaultAlignment(), {}, 'lena');
    expect(available.find((m) => m.id === 'first_connection')).toBeUndefined();
  });

  it('returns first_connection when conditions are met and not triggered', () => {
    const conn = { ...createDefaultConnection(), trust: 6, curiosity: 5, resistance: 1 };
    const available = getAvailableMoments(momentEvents, new Set(), conn, createDefaultAlignment(), {}, 'lena');
    expect(available.find((m) => m.id === 'first_connection')).toBeDefined();
  });

  it('returns shared_dream only for scoped character ids', () => {
    const conn = {
      ...createDefaultConnection(),
      trust: 8,
      curiosity: 9,
      resistance: 1,
    };
    const alignment = { ...createDefaultAlignment(), creator: 6 };
    const state = { curiosity: 8 };

    const jayAvailable = getAvailableMoments(momentEvents, new Set(), conn, alignment, state, 'jay');
    const lenaAvailable = getAvailableMoments(momentEvents, new Set(), conn, alignment, state, 'lena');

    expect(jayAvailable.find((m) => m.id === 'shared_dream')).toBeDefined();
    expect(lenaAvailable.find((m) => m.id === 'shared_dream')).toBeUndefined();
  });

  it('returns global moments even when character id is provided', () => {
    const conn = { ...createDefaultConnection(), trust: 6, curiosity: 5, resistance: 1 };
    const available = getAvailableMoments(momentEvents, new Set(), conn, createDefaultAlignment(), {}, 'zara');

    expect(available.find((m) => m.id === 'first_connection')).toBeDefined();
  });

  it('blocks higher-stage scoped moments until lower-stage scoped moments are triggered', () => {
    const conn = {
      ...createDefaultConnection(),
      trust: 8,
      curiosity: 9,
      comfort: 8,
      resistance: 1,
    };
    const alignment = { ...createDefaultAlignment(), manipulator: 5 };
    const state = { trust: 4 };

    const available = getAvailableMoments(momentEvents, new Set(), conn, alignment, state, 'lena');

    expect(available.find((m) => m.id === 'first_vulnerability')).toBeDefined();
    expect(available.find((m) => m.id === 'breaking_point')).toBeUndefined();
  });

  it('unlocks next scoped stage after previous scoped stage is triggered', () => {
    const conn = {
      ...createDefaultConnection(),
      trust: 8,
      curiosity: 9,
      comfort: 8,
      resistance: 1,
    };
    const alignment = { ...createDefaultAlignment(), manipulator: 5 };
    const state = { anxiety: 7, stress: 9 };
    const triggered = new Set(['first_vulnerability']);

    const available = getAvailableMoments(momentEvents, triggered, conn, alignment, state, 'lena');

    expect(available.find((m) => m.id === 'breaking_point')).toBeDefined();
  });

  it('allows one arc to progress even when another arc is blocked by requirements', () => {
    const parallelMoments: MomentEvent[] = [
      {
        id: 'arc_a_stage_1',
        stage: 1,
        arcId: 'arc_a',
        characterIds: ['lena'],
        title: 'Arc A Stage 1',
        description: 'A1',
        requirements: { minTrust: 5 },
        outcome: { connectionDelta: {}, stateDelta: {}, description: 'A1 outcome' },
        tone: 'emotional',
      },
      {
        id: 'arc_a_stage_2',
        stage: 2,
        arcId: 'arc_a',
        characterIds: ['lena'],
        title: 'Arc A Stage 2',
        description: 'A2',
        requirements: { minTrust: 10 },
        outcome: { connectionDelta: {}, stateDelta: {}, description: 'A2 outcome' },
        tone: 'dramatic',
      },
      {
        id: 'arc_b_stage_1',
        stage: 1,
        arcId: 'arc_b',
        characterIds: ['lena'],
        title: 'Arc B Stage 1',
        description: 'B1',
        requirements: { minTrust: 5 },
        outcome: { connectionDelta: {}, stateDelta: {}, description: 'B1 outcome' },
        tone: 'revelation',
      },
    ];

    const conn = { ...createDefaultConnection(), trust: 7, curiosity: 7, resistance: 1 };
    const triggered = new Set(['arc_a_stage_1']);
    const available = getAvailableMoments(parallelMoments, triggered, conn, createDefaultAlignment(), {}, 'lena');

    expect(available.find((m) => m.id === 'arc_a_stage_2')).toBeUndefined();
    expect(available.find((m) => m.id === 'arc_b_stage_1')).toBeDefined();
  });

  it('keeps arc progression independent when multiple arcs are eligible', () => {
    const parallelMoments: MomentEvent[] = [
      {
        id: 'arc_a_stage_1',
        stage: 1,
        arcId: 'arc_a',
        characterIds: ['lena'],
        title: 'Arc A Stage 1',
        description: 'A1',
        requirements: { minTrust: 4 },
        outcome: { connectionDelta: {}, stateDelta: {}, description: 'A1 outcome' },
        tone: 'emotional',
      },
      {
        id: 'arc_a_stage_2',
        stage: 2,
        arcId: 'arc_a',
        characterIds: ['lena'],
        title: 'Arc A Stage 2',
        description: 'A2',
        requirements: { minTrust: 4 },
        outcome: { connectionDelta: {}, stateDelta: {}, description: 'A2 outcome' },
        tone: 'dramatic',
      },
      {
        id: 'arc_b_stage_1',
        stage: 1,
        arcId: 'arc_b',
        characterIds: ['lena'],
        title: 'Arc B Stage 1',
        description: 'B1',
        requirements: { minTrust: 4 },
        outcome: { connectionDelta: {}, stateDelta: {}, description: 'B1 outcome' },
        tone: 'revelation',
      },
    ];

    const conn = { ...createDefaultConnection(), trust: 6, curiosity: 6, resistance: 1 };
    const triggered = new Set(['arc_a_stage_1']);
    const available = getAvailableMoments(parallelMoments, triggered, conn, createDefaultAlignment(), {}, 'lena');

    expect(available.find((m) => m.id === 'arc_a_stage_2')).toBeDefined();
    expect(available.find((m) => m.id === 'arc_b_stage_1')).toBeDefined();
  });

  it('first_vulnerability requires comfort and trust state gate', () => {
    const moment = momentEvents.find((m) => m.id === 'first_vulnerability')!;
    const conn = {
      ...createDefaultConnection(),
      trust: 6,
      comfort: 6,
      resistance: 2,
    };
    const state = { trust: 3 };

    expect(checkMomentRequirements(moment.requirements, conn, createDefaultAlignment(), state)).toBe(true);
  });

  it('blocks first_vulnerability when trust state is too low', () => {
    const moment = momentEvents.find((m) => m.id === 'first_vulnerability')!;
    const conn = {
      ...createDefaultConnection(),
      trust: 7,
      comfort: 7,
      resistance: 1,
    };
    const state = { trust: 2 };

    expect(checkMomentRequirements(moment.requirements, conn, createDefaultAlignment(), state)).toBe(false);
  });

  it('shared_dream requires creator alignment and curiosity state', () => {
    const moment = momentEvents.find((m) => m.id === 'shared_dream')!;
    const conn = {
      ...createDefaultConnection(),
      trust: 7,
      curiosity: 8,
      resistance: 2,
    };
    const alignment = { ...createDefaultAlignment(), creator: 4 };
    const state = { curiosity: 4 };

    expect(checkMomentRequirements(moment.requirements, conn, alignment, state)).toBe(true);
  });

  it('blocks shared_dream when creator alignment is too low', () => {
    const moment = momentEvents.find((m) => m.id === 'shared_dream')!;
    const conn = {
      ...createDefaultConnection(),
      trust: 7,
      curiosity: 9,
      resistance: 1,
    };
    const alignment = { ...createDefaultAlignment(), creator: 3 };
    const state = { curiosity: 5 };

    expect(checkMomentRequirements(moment.requirements, conn, alignment, state)).toBe(false);
  });

  it('breaking_point requires manipulator alignment', () => {
    const moment = momentEvents.find((m) => m.id === 'breaking_point')!;
    const conn = {
      ...createDefaultConnection(),
      trust: 5,
      resistance: 5,
    };
    const alignment = { ...createDefaultAlignment(), manipulator: 3 };
    const state = {};

    expect(checkMomentRequirements(moment.requirements, conn, alignment, state)).toBe(true);
  });

  it('blocks breaking_point when manipulator alignment is too low', () => {
    const moment = momentEvents.find((m) => m.id === 'breaking_point')!;
    const conn = {
      ...createDefaultConnection(),
      trust: 6,
      resistance: 4,
    };
    const alignment = { ...createDefaultAlignment(), manipulator: 2 };
    const state = {};

    expect(checkMomentRequirements(moment.requirements, conn, alignment, state)).toBe(false);
  });

  it('applies first_connection outcome deltas to connection and state', () => {
    const moment = momentEvents.find((m) => m.id === 'first_connection');
    if (!moment) throw new Error('first_connection missing');

    const baseConnection = { ...createDefaultConnection(), trust: 5, comfort: 0 };
    const baseState = { trust: 2 };
    const result = applyMomentOutcome(moment, baseConnection, baseState);

    expect(result.connection.trust).toBe(7);
    expect(result.connection.comfort).toBe(1);
    expect(result.state.trust).toBe(3);
  });

  it('audits moments with missing requiredState keys', () => {
    const generatedStateKeys = Array.from(
      new Set(
        influenceActions
          .flatMap((a) => a.effects)
          .filter((e) => e.target === 'state')
          .map((e) => e.key)
      )
    );

    const findings = auditMissingRequiredStateKeys(momentEvents, characters, generatedStateKeys);
    expect(findings).toHaveLength(0);
  });
});
