// Fitting a scene to any screen shape. Every scene calls useLayout() and
// watchScreen() at the start of create().
//
// The game uses Phaser.Scale.EXPAND (see main.js): a design area is always
// fully visible, and the screen can be wider or taller than that. The story
// scenes use a 960x540 landscape design area; Climb uses 540x960 portrait.
// For landscape scenes, fitToScreen() handles the extra space:
//   Extra width:  the page just continues to the right.
//   Extra height: scroll the camera up so the floor stays at the bottom of the screen.

import { WIDTH, HEIGHT, CLIMB, COLORS } from './config.js';

export const LANDSCAPE = { width: WIDTH, height: HEIGHT, orientation: 'landscape' };
export const PORTRAIT = { width: CLIMB.width, height: CLIMB.height, orientation: 'portrait' };

// Switch the design area a scene is built for. EXPAND scales from the size in the
// game config, so changing it and refreshing rescales the whole game.
// It also tells index.html which way the phone should be held (for the rotate hint).
export function useLayout(scene, layout) {
  const game = scene.sys.game;
  document.body.dataset.orientation = layout.orientation;
  if (game.config.width === layout.width && game.config.height === layout.height) return;
  game.config.width = layout.width;
  game.config.height = layout.height;
  scene.scale.refresh();
}

export function fitToScreen(scene) {
  const { width, height } = scene.scale;
  const top = HEIGHT - height; // 0 on a 16:9 screen, negative on a taller one
  scene.cameras.main.setScroll(0, top);
  scene.physics.world.setBounds(0, top, width, height);
}

// Fit now, and again whenever the screen changes size (phone rotation, the
// browser's address bar hiding, a resized window). A scene can pass its own
// `fit` function instead of the landscape fitToScreen().
export function watchScreen(scene, fit = fitToScreen) {
  const onResize = () => fit(scene);
  onResize();
  scene.scale.on('resize', onResize);
  // Stop listening when the scene shuts down, or each restart would add another listener.
  scene.events.once('shutdown', () => scene.scale.off('resize', onResize));
}

// Fade the screen in from blank paper (used when a scene starts).
export function fadeInFromPaper(scene, durationMs = 400) {
  scene.cameras.main.fadeIn(durationMs, ...rgb(COLORS.paper));
}

// Fade to blank paper, then call `then` (used to leave a scene).
export function fadeOutToPaper(scene, then, durationMs = 400) {
  scene.cameras.main.fadeOut(durationMs, ...rgb(COLORS.paper));
  scene.cameras.main.once('camerafadeoutcomplete', then);
}

// Split a 0xRRGGBB color into [r, g, b], which the camera fade functions want.
function rgb(color) {
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}
