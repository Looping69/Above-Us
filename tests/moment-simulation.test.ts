import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../src/ui/stores/useGameStore';
import { influenceActions } from '../src/game/data/influence-actions';

type Scenario = {
  momentId: string;
  characterId: string;
  actionIds: string[];
};

function runScenario(scenario: Scenario): Set<string> {
  useGameStore.getState().resetGame();
  useGameStore.setState({
    focusedCharacterId: scenario.characterId,
    attention: 50,
    maxAttention: 50,
    activeMoment: null,
  });

  for (const actionId of scenario.actionIds) {
    const action = influenceActions.find((a) => a.id === actionId);
    if (!action) throw new Error(`Missing action: ${actionId}`);
    useGameStore.getState().applyAction(action, scenario.characterId);
  }

  return useGameStore.getState().triggeredMoments;
}

describe('moment reachability simulation', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('triggers every scoped moment through at least one viable scripted path', () => {
    const scenarios: Scenario[] = [
      {
        // Build curiosity + trust, trigger first_connection first, then first_vulnerability.
        momentId: 'first_vulnerability',
        characterId: 'lena',
        actionIds: [
          'nudge_thought',
          'nudge_thought',
          'nudge_thought',
          'nudge_thought',
          'steady_presence',
          'steady_presence',
          'steady_presence',
          'nudge_thought',
        ],
      },
      {
        // Build state curiosity + creator alignment; first_connection triggers first, then shared_dream.
        momentId: 'shared_dream',
        characterId: 'jay',
        actionIds: [
          'nudge_thought',
          'nudge_thought',
          'nudge_thought',
          'nudge_thought',
          'spark_change',
          'spark_change',
          'steady_presence',
          'steady_presence',
          'nudge_thought',
        ],
      },
      {
        // For zara, trust_arc stage 2 is directly reachable because no stage 1 is scoped.
        momentId: 'breaking_point',
        characterId: 'zara',
        actionIds: ['steady_presence', 'steady_presence', 'nudge_thought', 'nudge_thought'],
      },
    ];

    for (const scenario of scenarios) {
      const triggered = runScenario(scenario);
      expect(triggered.has(scenario.momentId)).toBe(true);
    }
  });
});
