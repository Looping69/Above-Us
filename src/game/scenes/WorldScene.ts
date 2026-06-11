import Phaser from 'phaser';
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from '../iso/iso-utils';
import { characters } from '../data/characters';
import type { Character } from '../types/character';
import { useGameStore } from '../../ui/stores/useGameStore';

const GRID_W = 12;
const GRID_H = 12;
const ORIGIN_X = 400;
const ORIGIN_Y = 100;

type SpriteData = {
  character: Character;
  container: Phaser.GameObjects.Container;
  circle: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
  targetTile: { x: number; y: number };
  currentTile: { x: number; y: number };
  moveCooldown: number;
};

type InfluenceAppliedEventDetail = {
  targetId: string;
  actionId: string;
};

const INFLUENCE_TINT: Record<string, number> = {
  nudge_thought: 0xff5a5a,
  steady_presence: 0x52d273,
  amplify_emotion: 0xff6fb0,
  spark_change: 0x52a8ff,
};

export class WorldScene extends Phaser.Scene {
  private sprites: SpriteData[] = [];
  private selectionRing!: Phaser.GameObjects.Ellipse;
  private selectedId: string | null = null;
  private onInfluenceApplied = (event: Event) => {
    const customEvent = event as CustomEvent<InfluenceAppliedEventDetail>;
    if (!customEvent.detail) return;
    this.emitInfluenceParticles(customEvent.detail.targetId, customEvent.detail.actionId);
  };

  constructor() {
    super({ key: 'WorldScene' });
  }

  create() {
    this.drawGrid();
    this.spawnCharacters();
    this.setupCamera();
    this.setupInput();
    this.createParticleTexture();

    // Selection ring (hidden until selection)
    this.selectionRing = this.add.ellipse(0, 0, 56, 28, 0xffffff, 0);
    this.selectionRing.setStrokeStyle(2, 0xffd700);
    this.selectionRing.setDepth(1);
    this.selectionRing.setVisible(false);

    // Subscribe to store selection changes from React side
    useGameStore.subscribe((state) => {
      this.selectedId = state.focusedCharacterId;
      this.updateSelectionRing();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('above-us:influence-applied', this.onInfluenceApplied);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('above-us:influence-applied', this.onInfluenceApplied);
      }
    });
  }

  private createParticleTexture() {
    const textureKey = 'influence-particle';
    if (this.textures.exists(textureKey)) return;

    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture(textureKey, 12, 12);
    gfx.destroy();
  }

  private drawGrid() {
    const gfx = this.add.graphics();

    for (let tx = 0; tx < GRID_W; tx++) {
      for (let ty = 0; ty < GRID_H; ty++) {
        const { x, y } = isoToScreen(tx, ty);
        const wx = x + ORIGIN_X;
        const wy = y + ORIGIN_Y;

        const shade = (tx + ty) % 2 === 0 ? 0x1a1a2e : 0x16213e;
        gfx.fillStyle(shade, 1);
        gfx.fillPoints([
          { x: wx, y: wy - TILE_HEIGHT / 2 },
          { x: wx + TILE_WIDTH / 2, y: wy },
          { x: wx, y: wy + TILE_HEIGHT / 2 },
          { x: wx - TILE_WIDTH / 2, y: wy },
        ], true);

        gfx.lineStyle(1, 0x0f3460, 0.6);
        gfx.strokePoints([
          { x: wx, y: wy - TILE_HEIGHT / 2 },
          { x: wx + TILE_WIDTH / 2, y: wy },
          { x: wx, y: wy + TILE_HEIGHT / 2 },
          { x: wx - TILE_WIDTH / 2, y: wy },
        ], true);
      }
    }
  }

  private spawnCharacters() {
    const startTiles = [
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 5, y: 5 },
      { x: 2, y: 8 },
      { x: 8, y: 8 },
    ];

    characters.forEach((char, i) => {
      const tile = startTiles[i] ?? { x: 3 + i, y: 3 };
      const { x, y } = isoToScreen(tile.x, tile.y);
      const wx = x + ORIGIN_X;
      const wy = y + ORIGIN_Y;

      // Body
      const circle = this.add.ellipse(0, -20, 28, 28, char.color);
      circle.setStrokeStyle(2, 0xffffff);

      // Shadow
      const shadow = this.add.ellipse(0, 0, 36, 18, 0x000000, 0.4);

      // Name label
      const label = this.add.text(0, -40, char.name, {
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5, 1);

      const container = this.add.container(wx, wy, [shadow, circle, label]);
      container.setDepth(wy);
      container.setInteractive(
        new Phaser.Geom.Circle(0, -20, 18),
        Phaser.Geom.Circle.Contains
      );

      container.on('pointerdown', () => {
        useGameStore.getState().selectCharacter(char.id);
      });

      container.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
        circle.setFillStyle(Phaser.Display.Color.GetColor32(
          Math.min(255, Phaser.Display.Color.IntegerToRGB(char.color).r + 40),
          Math.min(255, Phaser.Display.Color.IntegerToRGB(char.color).g + 40),
          Math.min(255, Phaser.Display.Color.IntegerToRGB(char.color).b + 40),
          255
        ));
      });

      container.on('pointerout', () => {
        this.input.setDefaultCursor('default');
        circle.setFillStyle(char.color);
      });

      this.sprites.push({
        character: char,
        container,
        circle,
        label,
        targetTile: { ...tile },
        currentTile: { ...tile },
        moveCooldown: i * 60, // stagger movement starts
      });
    });
  }

  private setupCamera() {
    this.cameras.main.setBackgroundColor(0x0a0a0f);
    // Keyboard pan
    this.input.keyboard?.on('keydown-LEFT', () => this.cameras.main.scrollX -= 20);
    this.input.keyboard?.on('keydown-RIGHT', () => this.cameras.main.scrollX += 20);
    this.input.keyboard?.on('keydown-UP', () => this.cameras.main.scrollY -= 20);
    this.input.keyboard?.on('keydown-DOWN', () => this.cameras.main.scrollY += 20);
  }

  private setupInput() {
    // Click on empty grid to deselect
    this.input.on('pointerdown', (_ptr: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (targets.length === 0) {
        useGameStore.getState().selectCharacter(null);
      }
    });
  }

  private updateSelectionRing() {
    if (!this.selectedId) {
      this.selectionRing.setVisible(false);
      return;
    }
    const s = this.sprites.find((sp) => sp.character.id === this.selectedId);
    if (!s) { this.selectionRing.setVisible(false); return; }
    this.selectionRing.setPosition(s.container.x, s.container.y);
    this.selectionRing.setDepth(s.container.depth - 0.1);
    this.selectionRing.setVisible(true);
  }

  update(_time: number, delta: number) {
    for (const s of this.sprites) {
      s.moveCooldown -= delta;
      if (s.moveCooldown <= 0) {
        this.chooseNextTile(s);
        s.moveCooldown = Phaser.Math.Between(2000, 5000);
      }

      // Lerp toward target
      const target = isoToScreen(s.targetTile.x, s.targetTile.y);
      const tx = target.x + ORIGIN_X;
      const ty = target.y + ORIGIN_Y;
      s.container.x = Phaser.Math.Linear(s.container.x, tx, 0.05);
      s.container.y = Phaser.Math.Linear(s.container.y, ty, 0.05);
      s.container.setDepth(s.container.y);
    }

    if (this.selectedId) this.updateSelectionRing();
  }

  private chooseNextTile(s: SpriteData) {
    const dirs = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 0, y: 0 }, // stay
    ];
    const dir = Phaser.Utils.Array.GetRandom(dirs);
    const nx = Phaser.Math.Clamp(s.targetTile.x + dir.x, 0, GRID_W - 1);
    const ny = Phaser.Math.Clamp(s.targetTile.y + dir.y, 0, GRID_H - 1);
    s.targetTile = { x: nx, y: ny };
  }

  private emitInfluenceParticles(targetId: string, actionId: string) {
    const targetSprite = this.sprites.find((s) => s.character.id === targetId);
    if (!targetSprite) return;

    const tint = INFLUENCE_TINT[actionId] ?? 0xffffff;
    const particles = this.add.particles(
      targetSprite.container.x,
      targetSprite.container.y - 24,
      'influence-particle',
      {
      quantity: 16,
      speed: { min: 30, max: 90 },
      angle: { min: 240, max: 300 },
      gravityY: -20,
      lifespan: { min: 450, max: 900 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint,
      blendMode: Phaser.BlendModes.ADD,
      }
    );
    particles.setDepth(targetSprite.container.depth + 1);

    this.time.delayedCall(900, () => particles.destroy());
  }
}
