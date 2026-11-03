// Works out where everything on the home page goes. Pure numbers, no Phaser,
// so it can be tested in Node. Rules and values live in HOME (src/config.js).
import { HOME, PAPER, PLAYER } from '../config.js';
import { lineY } from '../objects/Paper.js';

// Panels in one strip: equal widths with a gutter, unless one is `wide`.
function layoutPanels(panels, top, height) {
  const span = HOME.contentRight - HOME.contentLeft;
  const count = panels.length;
  const width = panels.some((p) => p.wide) ? span : (span - (count - 1) * HOME.gutter) / count;
  return panels.map((panel, i) => ({
    ...panel,
    x: HOME.contentLeft + i * (width + HOME.gutter),
    y: top,
    width,
    height,
  }));
}

function layoutStrip(strip, index) {
  const titleLine = HOME.firstTitleLine + index * HOME.stripLines;
  const floorLine = titleLine + HOME.floorOffsetLines;
  const titleY = lineY(titleLine);
  const floorY = lineY(floorLine);
  // The panel's bottom edge floats just above the figure's head.
  const top = titleY + HOME.panelGapBelowTitle;
  const bottom = floorY - PLAYER.bodyHeight - HOME.headroom;
  return {
    title: strip.title,
    titleY,
    floorLine,
    floorY,
    panels: layoutPanels(strip.panels, top, bottom - top),
  };
}

export function layoutPage(strips) {
  const laid = strips.map(layoutStrip);
  const landings = laid.map((s) => s.floorY);
  const mastheadBottom = lineY(HOME.firstTitleLine) - 40; // room for the first title
  return {
    masthead: {
      x: HOME.contentLeft,
      y: HOME.mastheadTop,
      width: HOME.contentRight - HOME.contentLeft,
      height: mastheadBottom - HOME.mastheadTop,
    },
    strips: laid,
    ladder: {
      x: HOME.ladderX,
      width: HOME.ladderWidth,
      top: landings[0],
      bottom: landings[landings.length - 1],
      landings,
    },
    pageHeight: landings[landings.length - 1] + HOME.bottomLines * PAPER.lineSpacing,
  };
}
