import { Alignment } from '../theme/Alignment.js';
import { type Alignment2D } from '../theme/Alignment2D.js';

/**
 * Reusable function for resolving container's child's layout constraints given
 * the container's layout constraints, padding and alignment.
 *
 * @category Helper
 */
export function resolveContainerChildConstraints(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number, hPadding: number, vPadding: number, alignment: Readonly<Alignment2D>): [childMinWidth: number, childMaxWidth: number, childMinHeight: number, childMaxHeight: number] {
    // Get padding
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
    } else if(alignment.horizontal === Alignment.SoftStretch) {
        childMinWidth = Math.max(minWidth - hPadding, 0);
    }

    let childMinHeight = 0;
    if(alignment.vertical === Alignment.Stretch) {
        if(childMaxHeight !== Infinity) {
            childMinHeight = childMaxHeight;
        } else {
            childMinHeight = Math.max(minHeight - vPadding, 0);
        }
    } else if(alignment.vertical === Alignment.SoftStretch) {
        childMinHeight = Math.max(minHeight - vPadding, 0);
    }

    return [childMinWidth, childMaxWidth, childMinHeight, childMaxHeight];
}
