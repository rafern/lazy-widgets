/**
 * Alignment of container contents. Used for when {@link Container} has too much
 * space.
 *
 * @category Theme
 */
export const enum Alignment {
    /** Give the extra space to the child, potentially stretching it. */
    Stretch = 'stretch',
    /**
     * Align the child to the start of the container, having the extra space at
     * the end. Equivalent to using a ratio of 0.
     */
    Start = 0,
    /**
     * Align the child to the center of the container, having the extra space
     * split equally to both the start and the end. Equivalent to using a ratio
     * of 0.5.
     */
    Center = 0.5,
    /**
     * Align the child to the end of the container, having the extra space at
     * the start. Equivalent to using a ratio of 1.
     */
    End = 1,
}
