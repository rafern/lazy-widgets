/**
 * An axis coupling mode is a mode that is applied to a {@link ViewportWidget}
 * on a per-axis basis. The mode controls how a ViewportWidget's axis length
 * relates to a ViewportWidget child's axis length.
 *
 * If two axes are not coupled, then they do not affect each other's length in
 * any way. If two axes are bi-directionally coupled, then they will always have
 * the same length. If two axes are uni-directionally coupled, then one axis
 * will affect the length of another axis, but not the other way around.
 *
 * @category Widget
 */
export enum AxisCoupling {
    /**
     * Doesn't couple a {@link ViewportWidget}'s axis to its child; the
     * viewport's axis length is completely separate from the child's axis
     * length.
     *
     * Default axis coupling mode for ViewportWidget.
     */
    None,
    /**
     * Bi-directional coupling. The {@link ViewportWidget}'s axis will be equal
     * to its child's axis. Use this if the axis being tied isn't meant to be
     * scrollable.
     */
    Bi,
    /**
     * Uni-directional coupling. The {@link ViewportWidget}'s axis will be
     * resolved as a regular Widget, but the result will be transferred to the
     * child's minimum axis length constraint.
     *
     * Default axis coupling mode for {@link TextArea}.
     */
    Uni,
}
