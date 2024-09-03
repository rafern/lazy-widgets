/**
 * Alignment of container contents. Used for when {@link Container} has too much
 * space.
 *
 * @category Theme
 */
export enum Alignment {
    /**
     * Give the maximum available space to the child (taking into account
     * container padding), potentially stretching it.
     */
    Stretch = 'stretch',
    // TODO maybe make SoftStretch the default? it seems like a happy middle-
    //      -ground between the nuclear-bomb-esque incompatible behaviour of
    //      0.10, and the old behaviour of 0.9
    /**
     * Propagates minimum axis length to the child (taking into account
     * container padding), potentially stretching it, but not growing it beyond
     * the minimum container axis lenght unless necessary.
     */
    SoftStretch = 'soft-stretch',
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
