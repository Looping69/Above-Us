import { describe, expect, it } from 'vitest';
import { useGameStore } from '../src/ui/stores/useGameStore';

describe('adult content preference', () => {
  it('defaults explicit adult scenes on for the adult build', () => {
    expect(useGameStore.getState().adultContentEnabled).toBe(true);
  });

  it('can hide and restore explicit adult scene text', () => {
    useGameStore.getState().setAdultContentEnabled(false);
    expect(useGameStore.getState().adultContentEnabled).toBe(false);

    useGameStore.getState().setAdultContentEnabled(true);
    expect(useGameStore.getState().adultContentEnabled).toBe(true);
  });
});
