import { describe, it, expect } from 'vitest';
import { applyInfluenceAction } from '../src/game/systems/influence-system';
import { createDefaultAlignment } from '../src/game/systems/alignment-system';
import { createDefaultConnection } from '../src/game/systems/connection-system';
import { influenceActions } from '../src/game/data/influence-actions';

describe('influence-system', () => {
  it('steady_presence increases trust and comfort, reduces resistance', () => {
    const action = influenceActions.find((a) => a.id === 'steady_presence')!;
    const result = applyInfluenceAction(
      action,
      createDefaultAlignment(),
      createDefaultConnection(),
      {}
    );
    expect(result.newConnection.trust).toBe(2);
    expect(result.newConnection.comfort).toBe(2);
    expect(result.newConnection.resistance).toBe(0); // clamped at 0
  });

  it('steady_presence adds guardian alignment', () => {
    const action = influenceActions.find((a) => a.id === 'steady_presence')!;
    const result = applyInfluenceAction(action, createDefaultAlignment(), createDefaultConnection(), {});
    expect(result.newAlignment.guardian).toBe(2);
  });

  it('amplify_emotion adds tempter alignment', () => {
    const action = influenceActions.find((a) => a.id === 'amplify_emotion')!;
    const result = applyInfluenceAction(action, createDefaultAlignment(), createDefaultConnection(), {});
    expect(result.newAlignment.tempter).toBe(2);
  });

  it('nudge_thought adds manipulator alignment', () => {
    const action = influenceActions.find((a) => a.id === 'nudge_thought')!;
    const result = applyInfluenceAction(action, createDefaultAlignment(), createDefaultConnection(), {});
    expect(result.newAlignment.manipulator).toBe(2);
  });

  it('spark_change adds creator alignment', () => {
    const action = influenceActions.find((a) => a.id === 'spark_change')!;
    const result = applyInfluenceAction(action, createDefaultAlignment(), createDefaultConnection(), {});
    expect(result.newAlignment.creator).toBe(2);
  });

  it('connection values clamp at 10', () => {
    const action = influenceActions.find((a) => a.id === 'steady_presence')!;
    const highConn = { ...createDefaultConnection(), trust: 9, comfort: 9 };
    const result = applyInfluenceAction(action, createDefaultAlignment(), highConn, {});
    expect(result.newConnection.trust).toBe(10);
    expect(result.newConnection.comfort).toBe(10);
  });
});
