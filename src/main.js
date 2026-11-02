import Phaser from 'phaser';
import { WIDTH, HEIGHT, COLORS, PLAYER } from './config.js';
import { GameScene } from './scenes/GameScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO, // WebGL if available, otherwise Canvas
  parent: 'game',
  backgroundColor: COLORS.desk,
  scale: {
    // EXPAND scales the game to fill the whole screen. The 960x540 area is
    // always visible; on a wider (or taller) screen the game grows to show
    // extra page instead of leaving bars. GameScene handles the extra space.
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PLAYER.gravity },
      debug: false, // set true to see the physics boxes
    },
  },
  input: {
    activePointers: 3, // allow e.g. holding "right" and tapping "jump" at once
  },
  scene: [GameScene],
});

// In development, expose the game so you can poke at it from the browser console,
// e.g. game.scene.getScene('GameScene').player
if (import.meta.env.DEV) {
  window.game = game;
}
