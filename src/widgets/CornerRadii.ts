/** A corner radius which may form an ellipse instead of circle. */
export interface NonUniformCornerRadius {
    x: number;
    y: number;
}

/** A corner radius to be used for rounding corners. */
export type CornerRadius = number | NonUniformCornerRadius

/**
 * Corner radius configuration to be used with
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect | CanvasRenderingContext2D.roundRect}
 */
export type CornerRadii = CornerRadius | [ allCorners: CornerRadius ] | [ topLeftAndBottomRight: CornerRadius, topRightAndBottomLeft: CornerRadius ] | [ topLeft: CornerRadius, topRightAndBottomLeft: CornerRadius, bottomRight: CornerRadius ] | [ topLeft: CornerRadius, topRight: CornerRadius, bottomRight: CornerRadius, bottomLeft: CornerRadius ];
