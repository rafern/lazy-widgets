import { type Viewport } from '../core/Viewport.js';
import { type Rect } from './Rect.js';
import { viewportRelativePointToAbsolute } from './viewportRelativePointToAbsolute.js';

/**
 * Convert a {@link Rect} relative to a viewport into absolute coordinates,
 * while making sure the the rectangle is clipped to the viewport's absolute
 * rectangle.
 *
 * @category Helper
 */
export function clipRelativeRectToAbsoluteViewport(viewport: Viewport, viewportAbsoluteRect: Readonly<Rect>, rect: Readonly<Rect>): Rect | null {
    // convert damage region from relative coordinates to absolute
    // coordinates if necessary
    let left = rect[0], top = rect[1], right: number, bottom: number
    if (viewport.relativeCoordinates) {
        [left, top] = viewportRelativePointToAbsolute(viewport, left, top);
        right = Math.ceil(left + rect[2]);
        bottom = Math.ceil(top + rect[3]);
        left = Math.floor(left);
        top = Math.floor(top);
    } else {
        right = left + rect[2];
        bottom = top + rect[3];
    }

    // clip dirty rects to avoid dirty rects being spammed from widgets that
    // are offscreen and therefore won't be painted, causing a loop of
    // constant dirty rects
    const vpLeft = viewportAbsoluteRect[0];
    const vpRight = vpLeft + viewportAbsoluteRect[2];
    if (left < vpLeft) {
        left = vpLeft;
    }
    if (right > vpRight) {
        right = vpRight;
    }

    if (left >= right) {
        return null;
    }

    const vpTop = viewportAbsoluteRect[1];
    const vpBottom = vpTop + viewportAbsoluteRect[3];
    if (top < vpTop) {
        top = vpTop;
    }
    if (bottom > vpBottom) {
        bottom = vpBottom;
    }

    if (top >= bottom) {
        return null;
    }

    return [ left, top, right - left, bottom - top ];
}
