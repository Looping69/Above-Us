import { describe, it, expect } from 'vitest';
import { characters } from '../src/game/data/characters';

describe('character-data', () => {
  it('has exactly 5 characters', () => {
    expect(characters).toHaveLength(5);
  });

  it('all characters have required fields', () => {
    for (const c of characters) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.age).toBeGreaterThanOrEqual(18);
      expect(c.role).toBeTruthy();
      expect(c.traits).toBeDefined();
      expect(c.state).toBeDefined();
      expect(c.desires.length).toBeGreaterThan(0);
      expect(c.fears.length).toBeGreaterThan(0);
      expect(c.defaultLocation).toBeTruthy();
      expect(c.evolutionPaths.length).toBeGreaterThan(0);
    }
  });

  it('all characters are adults (age >= 18)', () => {
    for (const c of characters) {
      expect(c.age).toBeGreaterThanOrEqual(18);
    }
  });

  it('character ids match expected MVP roster', () => {
    const ids = characters.map((c) => c.id);
    expect(ids).toContain('lena');
    expect(ids).toContain('jay');
    expect(ids).toContain('maya');
    expect(ids).toContain('ethan');
    expect(ids).toContain('zara');
  });
});
