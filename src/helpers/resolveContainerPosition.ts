import type { Alignment2D } from '../theme/Alignment2D.js';
import type { Padding } from '../theme/Padding.js';
import type { Widget } from '../widgets/Widget.js';
import { resolveContainerChildPosition } from './resolveContainerChildPosition.js';

/**
 * Reusable function for resolving container positions.
 *
 * @category Helper
 */
export function resolveContainerPosition<W extends Widget>(x: number, y: number, idealWidth: number, idealHeight: number, padding: Padding, alignment: Alignment2D, child: W) {
    child.resolvePosition(...resolveContainerChildPosition(x, y, idealWidth, idealHeight, padding, alignment, ...child.idealDimensions));
}
