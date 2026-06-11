export type Character = {
  id: string;
  name: string;
  age: number;
  role: string;
  archetype: string;
  primaryTension: string;
  traits: Record<string, number>;
  state: Record<string, number>;
  desires: string[];
  fears: string[];
  defaultLocation: string;
  evolutionPaths: string[];
  color: number; // Phaser hex colour for placeholder sprite
};

export type CharacterConnection = {
  trust: number;
  curiosity: number;
  dependence: number;
  attraction: number;
  comfort: number;
  resistance: number;
};
