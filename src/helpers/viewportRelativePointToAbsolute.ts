import { type Viewport } from '../core/Viewport.js';

/**
 * Convert a point relative to a viewport into an absolute coordinate. You
 * usually only need this if {@link Viewport#relativeCoordinates} is true.
 *
 * @category Helper
 */
export function viewportRelativePointToAbsolute(viewport: Viewport, x: number, y: number): [x: number, y: number] {
    x += viewport.rect[0] + viewport.offset[0];
    y += viewport.rect[1] + viewport.offset[1];
    return [x, y];
}
