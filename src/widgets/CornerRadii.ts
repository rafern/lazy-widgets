/**
 * Corner radius configuration to be used with
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect | CanvasRenderingContext2D.roundRect}
 */
export type CornerRadii = number | [ allCorners: number ] | [ topLeftAndBottomRight: number, topRightAndBottomLeft: number ] | [ topLeft: number, topRightAndBottomLeft: number, bottomRight: number ] | [ topLeft: number, topRight: number, bottomRight: number, bottomLeft: number ];
