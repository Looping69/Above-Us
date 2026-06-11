export type IsoCoord = { tileX: number; tileY: number };
export type ScreenCoord = { x: number; y: number };

const TILE_W = 64;
const TILE_H = 32;

export function isoToScreen(tileX: number, tileY: number): ScreenCoord {
  return {
    x: (tileX - tileY) * (TILE_W / 2),
    y: (tileX + tileY) * (TILE_H / 2),
  };
}

export function screenToIso(sx: number, sy: number): IsoCoord {
  return {
    tileX: Math.round(sy / TILE_H + sx / TILE_W),
    tileY: Math.round(sy / TILE_H - sx / TILE_W),
  };
}

export const TILE_WIDTH = TILE_W;
export const TILE_HEIGHT = TILE_H;
