import { create } from 'zustand';
import type { Character, CharacterConnection } from '../../game/types/character';
import type { PlayerAlignment } from '../../game/types/alignment';
import type { MomentEvent } from '../../game/types/moment';
import type { InfluenceAction } from '../../game/types/influence';
import { characters as defaultCharacters } from '../../game/data/characters';
import { createDefaultAlignment } from '../../game/systems/alignment-system';
import { createDefaultConnection } from '../../game/systems/connection-system';
import { applyInfluenceAction } from '../../game/systems/influence-system';
import { applyMomentOutcome, getAvailableMoments, getMomentTriggerId } from '../../game/systems/moment-system';
import { momentEvents } from '../../game/data/moment-events';
import { saveGame, loadGame, clearSave } from '../../game/persistence/save-load';
import {
  applyEvolutionInfluence,
  createInitialEvolutionProgress,
  type CharacterEvolutionProgress,
} from '../../game/systems/evolution-system';

type CharacterStates = Record<string, Record<string, number>>;
type ConnectionMap = Record<string, CharacterConnection>;
type EvolutionMap = Record<string, CharacterEvolutionProgress>;

type InfluenceAppliedEventDetail = {
  targetId: string;
  actionId: string;
};

type GameState = {
  characters: Character[];
  characterStates: CharacterStates;
  connections: ConnectionMap;
  evolutionByCharacter: EvolutionMap;
  alignment: PlayerAlignment;
  attention: number;
  maxAttention: number;
  focusedCharacterId: string | null;
  activeMoment: MomentEvent | null;
  triggeredMoments: Set<string>;
  adultContentEnabled: boolean;
  lastInfluenceFeedback: string | null;
  lastSavedAt: number | null;

  // Actions
  selectCharacter: (id: string | null) => void;
  applyAction: (action: InfluenceAction, targetId: string) => void;
  dismissMoment: () => void;
  setAdultContentEnabled: (enabled: boolean) => void;
  saveGame: () => void;
  resetGame: () => void;
};

function buildInitialState() {
  const connections: ConnectionMap = {};
  const characterStates: CharacterStates = {};
  const evolutionByCharacter: EvolutionMap = {};
  for (const c of defaultCharacters) {
    connections[c.id] = createDefaultConnection();
    characterStates[c.id] = { ...c.state };
    evolutionByCharacter[c.id] = createInitialEvolutionProgress(c.evolutionPaths);
  }

  const saved = loadGame();
  if (saved) {
    return {
      connections: saved.connections as ConnectionMap,
      characterStates: saved.characterStates,
      evolutionByCharacter: saved.evolutionByCharacter ?? evolutionByCharacter,
      alignment: saved.alignment,
      attention: saved.attention,
      triggeredMoments: new Set(saved.triggeredMoments),
      adultContentEnabled: saved.adultContentEnabled ?? true,
      lastSavedAt: saved.savedAt,
    };
  }
  return {
    connections,
    characterStates,
    evolutionByCharacter,
    alignment: createDefaultAlignment(),
    attention: 10,
    triggeredMoments: new Set<string>(),
    adultContentEnabled: true,
    lastSavedAt: null,
  };
}

function persistStateSnapshot(s: GameState, savedAt: number) {
  saveGame({
    characterStates: s.characterStates,
    connections: s.connections,
    evolutionByCharacter: s.evolutionByCharacter,
    alignment: s.alignment,
    attention: s.attention,
    triggeredMoments: Array.from(s.triggeredMoments),
    adultContentEnabled: s.adultContentEnabled,
    savedAt,
  });
}

export const useGameStore = create<GameState>((set, get) => {
  const initial = buildInitialState();

  return {
    characters: defaultCharacters,
    characterStates: initial.characterStates,
    connections: initial.connections,
    evolutionByCharacter: initial.evolutionByCharacter,
    alignment: initial.alignment,
    attention: initial.attention,
    maxAttention: 10,
    focusedCharacterId: null,
    activeMoment: null,
    triggeredMoments: initial.triggeredMoments,
    adultContentEnabled: initial.adultContentEnabled,
    lastInfluenceFeedback: null,
    lastSavedAt: initial.lastSavedAt,

    selectCharacter: (id) => set({ focusedCharacterId: id }),

    applyAction: (action, targetId) => {
      const state = get();
      if (state.attention < action.cost) {
        set({ lastInfluenceFeedback: 'Not enough attention.' });
        return;
      }

      const connection = state.connections[targetId] ?? createDefaultConnection();
      const charState = state.characterStates[targetId] ?? {};
      const result = applyInfluenceAction(action, state.alignment, connection, charState);
      const targetCharacter = state.characters.find((c) => c.id === targetId);
      if (!targetCharacter) {
        set({ lastInfluenceFeedback: 'Target character not found.' });
        return;
      }

      const currentEvolution =
        state.evolutionByCharacter[targetId] ?? createInitialEvolutionProgress(targetCharacter.evolutionPaths);
      const newEvolution = applyEvolutionInfluence(
        targetId,
        targetCharacter.evolutionPaths,
        currentEvolution,
        action
      );
      const evolvedNow = currentEvolution.evolvedPath === null && newEvolution.evolvedPath !== null;

      const newConnections = { ...state.connections, [targetId]: result.newConnection };
      const newCharStates = { ...state.characterStates, [targetId]: result.newState };
      const newEvolutionByCharacter = { ...state.evolutionByCharacter, [targetId]: newEvolution };
      const newAttention = state.attention - action.cost;

      const available = getAvailableMoments(
        momentEvents,
        state.triggeredMoments,
        result.newConnection,
        result.newAlignment,
        result.newState,
        targetId
      );

      const triggered = available.length > 0 ? available[0] : null;
      const newTriggered = new Set(state.triggeredMoments);
      if (triggered) newTriggered.add(getMomentTriggerId(triggered.id, targetId));

      const withMoment = triggered
        ? applyMomentOutcome(triggered, newConnections[targetId], newCharStates[targetId])
        : null;

      if (withMoment) {
        newConnections[targetId] = withMoment.connection;
        newCharStates[targetId] = withMoment.state;
      }

      set({
        alignment: result.newAlignment,
        connections: newConnections,
        evolutionByCharacter: newEvolutionByCharacter,
        characterStates: newCharStates,
        attention: newAttention,
        activeMoment: triggered ?? state.activeMoment,
        triggeredMoments: newTriggered,
        lastInfluenceFeedback: evolvedNow
          ? `${action.name} applied to ${targetId}. ${targetCharacter.name} evolved toward ${newEvolution.evolvedPath}.`
          : triggered
            ? `${action.name} applied to ${targetId}. Moment unlocked: ${triggered.title}.`
            : `${action.name} applied to ${targetId}.`,
      });

      if (typeof window !== 'undefined') {
        const detail: InfluenceAppliedEventDetail = {
          targetId,
          actionId: action.id,
        };
        window.dispatchEvent(new CustomEvent<InfluenceAppliedEventDetail>('above-us:influence-applied', { detail }));
      }

      // Restore attention over time (simple regen)
      if (newAttention < state.maxAttention) {
        setTimeout(() => {
          set((s) => ({ attention: Math.min(s.maxAttention, s.attention + 1) }));
        }, 3000);
      }
    },

    dismissMoment: () => set({ activeMoment: null }),

    setAdultContentEnabled: (enabled) => set({ adultContentEnabled: enabled }),

    saveGame: () => {
      const s = get();
      const now = Date.now();
      persistStateSnapshot(s, now);
      set({ lastSavedAt: now });
    },

    resetGame: () => {
      const adultContentEnabled = get().adultContentEnabled;
      clearSave();
      const connections: ConnectionMap = {};
      const characterStates: CharacterStates = {};
      const evolutionByCharacter: EvolutionMap = {};
      for (const c of defaultCharacters) {
        connections[c.id] = createDefaultConnection();
        characterStates[c.id] = { ...c.state };
        evolutionByCharacter[c.id] = createInitialEvolutionProgress(c.evolutionPaths);
      }
      set({
        characterStates,
        connections,
        evolutionByCharacter,
        alignment: createDefaultAlignment(),
        attention: 10,
        triggeredMoments: new Set(),
        adultContentEnabled,
        activeMoment: null,
        focusedCharacterId: null,
        lastInfluenceFeedback: null,
        lastSavedAt: null,
      });
    },
  };
});

// Auto-save after every meaningful state change
useGameStore.subscribe((state, prev) => {
  if (
    state.connections !== prev.connections ||
    state.characterStates !== prev.characterStates ||
    state.evolutionByCharacter !== prev.evolutionByCharacter ||
    state.alignment !== prev.alignment ||
    state.triggeredMoments !== prev.triggeredMoments ||
    state.attention !== prev.attention ||
    state.adultContentEnabled !== prev.adultContentEnabled
  ) {
    const now = Date.now();
    persistStateSnapshot(state, now);
    // update lastSavedAt without triggering another subscription cycle
    useGameStore.setState({ lastSavedAt: now });
  }
});
