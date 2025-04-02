/**
 * The bias to apply to a tooltip's positioning for a specific axis.
 *
 * For example, the vertical bias helps the tooltip decide whether it should
 * prefer appearing above or below the tooltip wrapper. The horizontal bias
 * helps the tooltip decide whether it should prefer appearing to the left or to
 * the right of the tooltip wrapper.
 *
 * Depending on the implementation, the tooltip container has no obligation to
 * take these biases into account, however, the default {@link TooltipContainer}
 * implementation does.
 *
 * @category Core
 */
export enum TooltipAxisBias {
    /**
     * The tooltip should decide whether to place before or after the wrapper on
     * this axis depending on context, with no bias. For example, this could be
     * decided from the anchor position of a tooltip container.
     */
    Auto,
    /**
     * The tooltip should decide prefer appearing before the wrapper on this
     * axis, unless it doesn't fit.
     */
    Before,
    /**
     * The tooltip should decide prefer appearing after the wrapper on this
     * axis, unless it doesn't fit.
     */
    After,
}
