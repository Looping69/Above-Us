import type { CharacterConnection } from '../types/character';
import type { PlayerAlignment } from '../types/alignment';
import type { CharacterEvolutionProgress } from '../systems/evolution-system';

const SAVE_KEY = 'above-us-save-v1';

export type SaveData = {
  characterStates: Record<string, Record<string, number>>;
  connections: Record<string, CharacterConnection>;
  evolutionByCharacter?: Record<string, CharacterEvolutionProgress>;
  alignment: PlayerAlignment;
  attention: number;
  triggeredMoments: string[];
  adultContentEnabled?: boolean;
  savedAt: number;
};

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (SSR / private mode) — silently skip
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // noop
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
