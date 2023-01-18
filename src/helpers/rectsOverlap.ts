import type { Rect } from './Rect';

/**
 * Check if 2 rectangles overlap.
 *
 * @returns Returns true if the rectangles overlap, false otherwise
 */
export function rectsOverlap(first: Rect, second: Rect) {
    // X test
    const firstLeft = first[0];
    const firstRight = firstLeft + first[2];
    const secondLeft = second[0];

    if (firstRight < secondLeft) {
        return false;
    }

    const secondRight = secondLeft + second[2];

    if (secondRight < secondLeft) {
        return false;
    }

    // Y test
    const firstTop = first[1];
    const firstBottom = firstTop + first[3];
    const secondTop = second[1];

    if (firstBottom < secondTop) {
        return false;
    }

    const secondBottom = secondTop + second[3];

    if (secondBottom < secondTop) {
        return false;
    }

    // done
    return true;
}
