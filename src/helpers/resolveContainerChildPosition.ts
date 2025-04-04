import { Alignment } from '../theme/Alignment.js';
import type { Alignment2D } from '../theme/Alignment2D.js';
import type { Padding } from '../theme/Padding.js';

/**
 * Reusable function for resolving a container's child's position. Similar to
 * {@link resolveContainerPosition}, but doesn't need to be passed the child
 * widget.
 *
 * @category Helper
 */
export function resolveContainerChildPosition(x: number, y: number, idealWidth: number, idealHeight: number, padding: Padding, alignment: Alignment2D, idealChildWidth: number, idealChildHeight: number): [childX: number, childY: number] {
    // Calculate used space
    const usedWidth = idealChildWidth + padding.left + padding.right;
    const usedHeight = idealChildHeight + padding.top + padding.bottom;

    // Horizontal offset
    let childX = x + padding.left;
    if(alignment.horizontal !== Alignment.Stretch && alignment.horizontal !== Alignment.SoftStretch) {
        // Get free space for this axis
        const freeSpace = idealWidth - usedWidth;

        // Ignore if free space is negative or zero, as in, the child didn't
        // even get the space they requested or just enough space. If there
        // is free space, distribute free space according to chosen
        // alignment ratio
        if(freeSpace > 0) {
            childX += freeSpace * alignment.horizontal;
        }
    }

    // Vertical offset
    let childY = y + padding.top;
    if(alignment.vertical !== Alignment.Stretch && alignment.vertical !== Alignment.SoftStretch) {
        // Same logic as above, but for vertical axis
        const freeSpace = idealHeight - usedHeight;

        if(freeSpace > 0) {
            childY += freeSpace * alignment.vertical;
        }
    }

    // Resolve child's position
    return [childX, childY];
}
