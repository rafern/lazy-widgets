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
 * implementation does. Note also that these definitions are purposefuly vague,
 * and how these are used is left to the implementation. For example, it doesn't
 * make sense to have a centre-biased vertical axis in the default tooltip
 * container implementation, but it does make sense to have a centre-biased
 * horizontal axis.
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
     * The tooltip should prefer appearing before the wrapper or anchor point on
     * this axis, unless it doesn't fit.
     */
    Before,
    /**
     * The tooltip should prefer appearing centred around the anchor point on
     * this axis if possible.
     */
    Center,
    /**
     * The tooltip should prefer appearing after the wrapper or anchor point on
     * this axis, unless it doesn't fit.
     */
    After,
}
