import { Alignment } from '../theme/Alignment.js';

import type { Alignment2D } from '../theme/Alignment2D.js';
import type { Padding } from '../theme/Padding.js';
import type { Widget } from '../widgets/Widget.js';

/**
 * Reusable function for resolving container dimensions given layout
 * constraints, padding, alignment and a child widget.
 *
 * @category Helper
 */
export function resolveContainerDimensions<W extends Widget>(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number, padding: Padding, alignment: Alignment2D, child: W) {
    // Get padding
    const hPadding = padding.left + padding.right;
    const vPadding = padding.top + padding.bottom;
    let childMaxWidth = maxWidth - hPadding;
    let childMaxHeight = maxHeight - vPadding;

    // If there isn't enough space for padding, resolve child's layout with
    // a tight fit of 0 for axis with lack of space
    if(childMaxWidth < 0) {
        childMaxWidth = 0;
    }
    if(childMaxHeight < 0) {
        childMaxHeight = 0;
    }

    // Provide minimum constraints if using stretch alignment, correcting
    // for padding. If maximum constraints are available (not infinite), use
    // those instead
    let childMinWidth = 0;
    if(alignment.horizontal === Alignment.Stretch) {
        if(childMaxWidth !== Infinity) {
            childMinWidth = childMaxWidth;
        } else {
            childMinWidth = Math.max(minWidth - hPadding, 0);
        }
    }

    let childMinHeight = 0;
    if(alignment.vertical === Alignment.Stretch) {
        if(childMaxHeight !== Infinity) {
            childMinHeight = childMaxHeight;
        } else {
            childMinHeight = Math.max(minHeight - vPadding, 0);
        }
    }

    // Resolve child's dimensions
    child.resolveDimensions(childMinWidth, childMaxWidth, childMinHeight, childMaxHeight);
    const [childWidth, childHeight] = child.idealDimensions;

    // Resolve own dimensions
    return [
        Math.max(minWidth, childWidth + hPadding),
        Math.max(minHeight, childHeight + vPadding)
    ];
}
