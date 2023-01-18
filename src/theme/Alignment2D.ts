import type { Alignment } from './Alignment';

/**
 * Like {@link Alignment}, but for both the horizontal and vertical axes. Each
 * axis can also be a ratio.
 *
 * @category Theme
 */
export interface Alignment2D {
    /** The alignment of the horizontal axis */
    horizontal: Alignment | number,
    /** The alignment of the vertical axis */
    vertical: Alignment | number,
}
