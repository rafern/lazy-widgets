/**
 * Alignment of multi-container contents along the main axis. Used for when
 * {@link MultiContainer} has unused space, even after distribution. Similar to
 * {@link Alignment}.
 *
 * @category Theme
 */
export const enum FlexAlignment {
    /** Distribute unused space between each child. */
    SpaceBetween = 'between',
    /** Distribute unused space between each child and at start and end. */
    SpaceAround = 'around',
    /**
     * Align the children to the start of the container, having the extra space
     * at the end. Equivalent to using a ratio of 0.
     */
    Start = 0,
    /**
     * Align the children to the center of the container, having the extra space
     * split equally to both the start and the end. Equivalent to using a ratio
     * of 0.5.
     */
    Center = 0.5,
    /**
     * Align the children to the end of the container, having the extra space at
     * the start. Equivalent to using a ratio of 1.
     */
    End = 1,
}
