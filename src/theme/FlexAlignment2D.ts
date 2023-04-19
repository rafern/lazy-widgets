import type { FlexAlignment } from './FlexAlignment.js';
import type { Alignment } from './Alignment.js';

/**
 * Like {@link Alignment2D}, but for multi-containers. Each axis can also be a
 * ratio.
 *
 * @category Theme
 */
export interface FlexAlignment2D {
    /** The alignment of the main axis */
    main: FlexAlignment | number,
    /** The alignment of the cross axis */
    cross: Alignment | number,
}
