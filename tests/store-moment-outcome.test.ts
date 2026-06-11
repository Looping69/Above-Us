import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../src/ui/stores/useGameStore';
import { influenceActions } from '../src/game/data/influence-actions';

describe('store moment outcome integration', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('applies first_connection outcome.connectionDelta and outcome.stateDelta when triggered', () => {
    const store = useGameStore.getState();

    useGameStore.setState((s) => ({
      focusedCharacterId: 'lena',
      connections: {
        ...s.connections,
        lena: { ...s.connections.lena, trust: 5, curiosity: 4, resistance: 0, comfort: 0 },
      },
      characterStates: {
        ...s.characterStates,
        lena: { ...s.characterStates.lena, trust: 2 },
      },
      triggeredMoments: new Set(),
      activeMoment: null,
      attention: 10,
    }));

    const action = influenceActions.find((a) => a.id === 'nudge_thought');
    if (!action) throw new Error('nudge_thought action missing');

    store.applyAction(action, 'lena');

    const after = useGameStore.getState();
    expect(after.activeMoment?.id).toBe('first_connection');

    // Base nudge_thought doesn't increase trust or comfort, so these values prove moment outcome application.
    expect(after.connections.lena.trust).toBe(7);
    expect(after.connections.lena.comfort).toBe(1);

    // first_connection now includes stateDelta: { trust: 1 }
    expect(after.characterStates.lena.trust).toBe(3);
  });
});
