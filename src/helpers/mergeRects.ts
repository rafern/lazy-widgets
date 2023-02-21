import type { Rect } from "./Rect";

/**
 * Merge a list of rectangles into a single rectangle. If there are no
 * rectangles to merge, then null is returned. Note that, if a single rectangle
 * is supplied, that same rectangle is returned without copying.
 *
 * @returns Returns the merged rectangle, or null if there are no input rectangles
 *
 * @category Helper
 */
export function mergeRects(rects: [Rect, ...Rect[]]): Rect;
export function mergeRects(rects: []): null;
export function mergeRects(rects: Array<Rect>): Rect | null {
    const rectCount = rects.length;

    if (rectCount === 0) {
        return null;
    } else if (rectCount === 1) {
        return rects[0];
    } else {
        const firstRect = rects[0];
        let minX = firstRect[0];
        let minY = firstRect[1];
        let maxX = firstRect[2] + minX;
        let maxY = firstRect[3] + minY;

        for (let i = 1; i < rectCount; i++) {
            const rect = rects[i];
            const x = rect[0];
            const y = rect[1];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + rect[2]);
            maxY = Math.max(maxY, y + rect[3]);
        }

        return [minX, minY, maxX - minX, maxY - minY];
    }
}
