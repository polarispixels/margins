// Draws a picture from data/pictures.js in boiling pencil.
//
// Pictures are lists of shapes in a 100 x 100 box; this maps them into a box of
// `size` px with its top-left corner at (x, y). Pass an rng from boilRng() so the
// lines wobble like everything else.

import { COLORS } from '../config.js';
import { pencilEllipse, pencilLine, pencilPolyline } from '../pencil.js';

export function drawPicture(g, rng, shapes, x, y, size, alpha = 1) {
  const k = size / 100;
  const px = (u) => x + u * k;
  const py = (v) => y + v * k;
  const points = (list) => {
    const pts = [];
    for (let i = 0; i < list.length; i += 2) pts.push({ x: px(list[i]), y: py(list[i + 1]) });
    return pts;
  };
  const width = Math.min(3.2, Math.max(1.5, 2.4 * k)); // heavier lines for bigger pictures

  for (const shape of shapes) {
    const [kind, ...args] = shape;
    const thin = args[args.length - 1] === 'thin';
    if (thin) args.pop();
    const style = { color: COLORS.pencil, width: thin ? width * 0.6 : width, alpha: (thin ? 0.75 : 0.9) * alpha };

    if (kind === 'line') {
      const [x1, y1, x2, y2] = args;
      pencilLine(g, rng, px(x1), py(y1), px(x2), py(y2), style);
    } else if (kind === 'path') {
      pencilPolyline(g, rng, points(args[0]), style);
    } else if (kind === 'loop') {
      const pts = points(args[0]);
      pencilPolyline(g, rng, [...pts, pts[0]], style);
    } else if (kind === 'circle' || kind === 'oval') {
      const [cx, cy, rx, ry = rx] = args;
      pencilEllipse(g, rng, px(cx), py(cy), rx * k, ry * k, { ...style, points: rx > 10 ? 16 : 10 });
    } else if (kind === 'dot') {
      const [cx, cy, r] = args;
      g.fillStyle(COLORS.pencil, 0.9 * alpha);
      g.fillCircle(px(cx), py(cy), r * k);
    } else if (kind === 'shade') {
      g.fillStyle(COLORS.pencil, 0.18 * alpha);
      g.fillPoints(points(args[0]), true);
    }
  }
}
