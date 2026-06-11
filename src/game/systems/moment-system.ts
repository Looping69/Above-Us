import type { MomentEvent, MomentRequirements } from '../types/moment';
import type { CharacterConnection } from '../types/character';
import type { PlayerAlignment } from '../types/alignment';

export function checkMomentRequirements(
  requirements: MomentRequirements,
  connection: CharacterConnection,
  alignment: PlayerAlignment,
  characterState: Record<string, number>
): boolean {
  if (requirements.minTrust !== undefined && connection.trust < requirements.minTrust) return false;
  if (requirements.minCuriosity !== undefined && connection.curiosity < requirements.minCuriosity) return false;
  if (requirements.minComfort !== undefined && connection.comfort < requirements.minComfort) return false;
  if (requirements.maxResistance !== undefined && connection.resistance > requirements.maxResistance) return false;

  if (requirements.minAlignment) {
    for (const [key, min] of Object.entries(requirements.minAlignment)) {
      if ((alignment[key as keyof PlayerAlignment] ?? 0) < (min ?? 0)) return false;
    }
  }

  if (requirements.requiredState) {
    for (const [key, min] of Object.entries(requirements.requiredState)) {
      if ((characterState[key] ?? 0) < min) return false;
    }
  }

  return true;
}

export function getAvailableMoments(
  moments: MomentEvent[],
  triggeredIds: Set<string>,
  connection: CharacterConnection,
  alignment: PlayerAlignment,
  characterState: Record<string, number>,
  targetCharacterId?: string
): MomentEvent[] {
  const scopedForCharacter =
    targetCharacterId === undefined
      ? []
      : moments.filter(
          (m) =>
            !triggeredIds.has(m.id) &&
            m.characterIds !== undefined &&
            m.characterIds.includes(targetCharacterId)
        );

  const nextStageByArc: Record<string, number> = {};
  for (const moment of scopedForCharacter) {
    const current = nextStageByArc[moment.arcId];
    nextStageByArc[moment.arcId] = current === undefined ? moment.stage : Math.min(current, moment.stage);
  }

  return moments
    .filter((m) => {
      if (triggeredIds.has(m.id)) return false;
      if (targetCharacterId !== undefined && m.characterIds && !m.characterIds.includes(targetCharacterId)) {
        return false;
      }

      if (
        targetCharacterId !== undefined &&
        m.characterIds !== undefined &&
        m.characterIds.includes(targetCharacterId) &&
        nextStageByArc[m.arcId] !== undefined &&
        m.stage !== nextStageByArc[m.arcId]
      ) {
        return false;
      }

      return checkMomentRequirements(m.requirements, connection, alignment, characterState);
    })
    .sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage;
      if (a.arcId !== b.arcId) return a.arcId.localeCompare(b.arcId);
      return a.id.localeCompare(b.id);
    });
}
