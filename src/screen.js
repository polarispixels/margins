// Fitting a scene to any screen shape. Every scene calls watchScreen() in create().
//
// The game uses Phaser.Scale.EXPAND (see main.js): the 960x540 design area is
// always visible, and the screen can be wider or taller than that.
//   Extra width:  the page just continues to the right.
//   Extra height: scroll the camera up so the floor stays at the bottom of the screen.

import { HEIGHT, COLORS } from './config.js';

export function fitToScreen(scene) {
  const { width, height } = scene.scale;
  const top = HEIGHT - height; // 0 on a 16:9 screen, negative on a taller one
  scene.cameras.main.setScroll(0, top);
  scene.physics.world.setBounds(0, top, width, height);
}

// Fit now, and again whenever the screen changes size (phone rotation, the
// browser's address bar hiding, a resized window).
export function watchScreen(scene) {
  const onResize = () => fitToScreen(scene);
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
