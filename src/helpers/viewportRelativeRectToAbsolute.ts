import { type Viewport } from '../core/Viewport.js';
import { type Rect } from './Rect.js';

/**
 * Convert a {@link Rect} relative to a viewport into absolute coordinates. You
 * usually only need this if {@link Viewport#relativeCoordinates} is true.
 *
 * @category Helper
 */
export function viewportRelativeRectToAbsolute(viewport: Viewport, rect: Readonly<Rect>): Rect {
    const vpX = viewport.rect[0] + viewport.offset[0];
    const vpY = viewport.rect[1] + viewport.offset[1];

    const left = rect[0] + vpX;
    const top = rect[1] + vpY;
    const right = rect[0] + rect[2] + vpX;
    const bottom = rect[1] + rect[3] + vpY;

    return [ left, top, right - left, bottom - top ];
}
