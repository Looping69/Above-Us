import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // No external assets needed for MVP — all graphics are drawn procedurally
  }

  create() {
    this.scene.start('WorldScene');
  }
}
