import type { Alignment2D } from '../theme/Alignment2D.js';
import type { Padding } from '../theme/Padding.js';
import type { Widget } from '../widgets/Widget.js';
import { resolveContainerChildConstraints } from './resolveContainerChildConstraints.js';

/**
 * Reusable function for resolving container dimensions given layout
 * constraints, padding, alignment and a child widget.
 *
 * @category Helper
 */
export function resolveContainerDimensions<W extends Widget>(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number, padding: Padding, alignment: Alignment2D, child: W) {
    const hPadding = padding.left + padding.right;
    const vPadding = padding.top + padding.bottom;

    // Resolve child's dimensions
    child.resolveDimensions(...resolveContainerChildConstraints(minWidth, maxWidth, minHeight, maxHeight, hPadding, vPadding, alignment));
    const [childWidth, childHeight] = child.idealDimensions;

    // Resolve own dimensions
    return [
        Math.max(minWidth, childWidth + hPadding),
        Math.max(minHeight, childHeight + vPadding)
    ];
}
