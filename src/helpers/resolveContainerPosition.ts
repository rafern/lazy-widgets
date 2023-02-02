import { Alignment } from '../theme/Alignment';

import type { Alignment2D } from '../theme/Alignment2D';
import type { Padding } from '../theme/Padding';
import type { Widget } from '../widgets/Widget';

export function resolveContainerPosition<W extends Widget>(x: number, y: number, idealWidth: number, idealHeight: number, padding: Padding, alignment: Alignment2D, child: W) {
    // Calculate used space
    const [childWidth, childHeight] = child.idealDimensions;
    const usedWidth = childWidth + padding.left + padding.right;
    const usedHeight = childHeight + padding.top + padding.bottom;

    // Horizontal offset
    let childX = x + padding.left;
    if(alignment.horizontal !== Alignment.Stretch) {
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
    if(alignment.vertical !== Alignment.Stretch) {
        // Same logic as above, but for vertical axis
        const freeSpace = idealHeight - usedHeight;

        if(freeSpace > 0) {
            childY += freeSpace * alignment.vertical;
        }
    }

    // Resolve child's position
    child.resolvePosition(childX, childY);
}