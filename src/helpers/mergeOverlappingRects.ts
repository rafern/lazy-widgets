import { mergeRects } from './mergeRects.js';
import { rectsOverlap } from './rectsOverlap.js';
import type { Rect } from './Rect.js';
/**
 * Similar to {@link mergeRects}, except only overlapping rectangles are merged.
 *
 * @returns Returns a list containing all merged rectangles
 *
 * @category Helper
 */
export function mergeOverlappingRects(rects: Array<Rect>) {
    if (rects.length === 0) {
        return [];
    }

    let merged: Array<Rect>;

    // eslint-disable-next-line no-constant-condition
    while(true) {
        const rectCount = rects.length;
        merged = [rects[0]];

        for (let i = 1; i < rectCount; i++) {
            const rect = rects[i];
            const mergedCount = merged.length;
            let wasMerged = false;

            for (let j = 0; j < mergedCount; j++) {
                const otherRect = merged[j];

                if (rectsOverlap(rect, otherRect)) {
                    wasMerged = true;
                    merged[j] = mergeRects([rect, otherRect]);
                    break;
                }
            }

            if (!wasMerged) {
                merged.push(rect);
            }
        }

        if (merged.length === rectCount) {
            break;
        }

        rects = merged;
    }

    return merged;
}
