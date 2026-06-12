import type { MomentEvent, MomentRequirements } from '../types/moment';
import type { Character, CharacterConnection } from '../types/character';
import type { PlayerAlignment } from '../types/alignment';
import { applyConnectionDelta } from './connection-system';

export type MissingStateKeyAudit = {
  momentId: string;
  key: string;
  severity: 'full' | 'partial';
  affectedCharacterIds: string[];
};

export function getMomentTriggerId(momentId: string, targetCharacterId?: string): string {
  return targetCharacterId === undefined ? momentId : `${targetCharacterId}:${momentId}`;
}

export function isMomentTriggered(
  momentId: string,
  triggeredIds: Set<string>,
  targetCharacterId?: string
): boolean {
  return triggeredIds.has(momentId) || triggeredIds.has(getMomentTriggerId(momentId, targetCharacterId));
}

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
            !isMomentTriggered(m.id, triggeredIds, targetCharacterId) &&
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
      if (isMomentTriggered(m.id, triggeredIds, targetCharacterId)) return false;
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

export function applyMomentOutcome(
  event: MomentEvent,
  connection: CharacterConnection,
  characterState: Record<string, number>
): { connection: CharacterConnection; state: Record<string, number> } {
  const connectionAfter = applyConnectionDelta(connection, event.outcome.connectionDelta);
  const stateAfter = { ...characterState };

  for (const [key, delta] of Object.entries(event.outcome.stateDelta)) {
    stateAfter[key] = Math.max(0, Math.min(10, (stateAfter[key] ?? 0) + delta));
  }

  return { connection: connectionAfter, state: stateAfter };
}

export function auditMissingRequiredStateKeys(
  moments: MomentEvent[],
  characters: Character[],
  generatedStateKeys: string[] = []
): MissingStateKeyAudit[] {
  const findings: MissingStateKeyAudit[] = [];
  const generated = new Set(generatedStateKeys);

  for (const moment of moments) {
    if (!moment.requirements.requiredState) continue;

    const scopedCharacters =
      moment.characterIds && moment.characterIds.length > 0
        ? characters.filter((c) => moment.characterIds?.includes(c.id))
        : characters;

    if (scopedCharacters.length === 0) continue;

    for (const key of Object.keys(moment.requirements.requiredState)) {
      if (generated.has(key)) continue;

      const affected = scopedCharacters.filter((c) => c.state[key] === undefined).map((c) => c.id);
      if (affected.length === 0) continue;

      findings.push({
        momentId: moment.id,
        key,
        severity: affected.length === scopedCharacters.length ? 'full' : 'partial',
        affectedCharacterIds: affected,
      });
    }
  }

  return findings;
}
