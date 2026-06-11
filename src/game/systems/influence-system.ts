import type { InfluenceAction } from '../types/influence';
import type { CharacterConnection } from '../types/character';
import type { PlayerAlignment } from '../types/alignment';
import { applyAlignmentDelta } from './alignment-system';
import { applyConnectionDelta } from './connection-system';

export type InfluenceResult = {
  newAlignment: PlayerAlignment;
  newConnection: CharacterConnection;
  newState: Record<string, number>;
};

export function applyInfluenceAction(
  action: InfluenceAction,
  alignment: PlayerAlignment,
  connection: CharacterConnection,
  characterState: Record<string, number>
): InfluenceResult {
  const newAlignment = applyAlignmentDelta(alignment, action.alignment);

  let connectionDelta: Partial<CharacterConnection> = {};
  let stateDelta: Record<string, number> = {};

  for (const effect of action.effects) {
    if (effect.target === 'connection') {
      connectionDelta = {
        ...connectionDelta,
        [effect.key]: (connectionDelta[effect.key as keyof CharacterConnection] ?? 0) + effect.delta,
      };
    } else if (effect.target === 'state') {
      stateDelta[effect.key] = (stateDelta[effect.key] ?? 0) + effect.delta;
    }
  }

  const newConnection = applyConnectionDelta(connection, connectionDelta);

  const newState = { ...characterState };
  for (const [key, delta] of Object.entries(stateDelta)) {
    newState[key] = Math.max(0, Math.min(10, (newState[key] ?? 0) + delta));
  }

  return { newAlignment, newConnection, newState };
}
