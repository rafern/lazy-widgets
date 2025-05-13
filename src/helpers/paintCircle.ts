import { type BackingCanvasContext } from "./BackingCanvas.js";

const TAU = Math.PI * 2;

/**
 * Painting utility: paints a circle. Coordinates are relative to the center of
 * the circle. Uses ctx's current fillStyle. Does not restore the context state
 * after finishing.
 *
 * @category Helper
 */
export function paintCircle(ctx: BackingCanvasContext, x: number, y: number, radius: number): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
}
