import type { CharacterConnection } from '../types/character';

export function createDefaultConnection(): CharacterConnection {
  return {
    trust: 0,
    curiosity: 0,
    dependence: 0,
    attraction: 0,
    comfort: 0,
    resistance: 0,
  };
}

export function applyConnectionDelta(
  current: CharacterConnection,
  delta: Partial<CharacterConnection>
): CharacterConnection {
  const clamp = (v: number) => Math.max(0, Math.min(10, v));
  return {
    trust: clamp(current.trust + (delta.trust ?? 0)),
    curiosity: clamp(current.curiosity + (delta.curiosity ?? 0)),
    dependence: clamp(current.dependence + (delta.dependence ?? 0)),
    attraction: clamp(current.attraction + (delta.attraction ?? 0)),
    comfort: clamp(current.comfort + (delta.comfort ?? 0)),
    resistance: clamp(current.resistance + (delta.resistance ?? 0)),
  };
}
