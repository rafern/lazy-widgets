import { CornerRadii, NonUniformCornerRadius } from '../widgets/CornerRadii.js';

/**
 * CanvasRenderingContext2D.roundRect, but safe to use in browsers without
 * support, like Firefox.
 *
 * @category Helper
 */
export function safeRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radii: CornerRadii) {
    // XXX implemented by following the spec:
    // https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-roundrect
    // note that the implementation deviates slightly from the spec; no subpath
    // with point (x, y) is created at the end

    // 1. validate x, y, w, h
    if (!isFinite(x) || isNaN(x) || !isFinite(y) || isNaN(y)
        || !isFinite(w) || isNaN(w) || !isFinite(h) || isNaN(h)) {
        return;
    }

    // 2. turn numerical radii into array
    if (typeof radii === 'number' || ('x' in radii && 'y' in radii)) {
        radii = [radii];
    }

    // 3. validate radii array length
    const cornerCount = radii.length;
    if (cornerCount !== 1 && cornerCount !== 2 && cornerCount !== 3 && cornerCount !== 4) {
        throw new RangeError('roundRect radii expected to be either a number, or an array of numbers with a length of 1, 2, 3 or 4');
    }

    // 4-5. validate each radius in radii array
    const normalizedRadii: NonUniformCornerRadius[] = [];

    for (const radius of radii) {
        if (typeof radius === 'number') {
            if (!isFinite(radius) || isNaN(radius)) {
                return;
            }

            if (!isFinite(radius) || isNaN(radius)) {
                throw new RangeError('roundRect radii expected to be zero or positive');
            }

            normalizedRadii.push({ x: radius, y: radius });
        } else {
            if (!isFinite(radius.x) || isNaN(radius.x)
                || !isFinite(radius.y) || isNaN(radius.y)) {
                return;
            }

            if (!isFinite(radius.x) || isNaN(radius.x)
                || !isFinite(radius.y) || isNaN(radius.y)) {
                throw new RangeError('roundRect radii expected to be zero or positive');
            }

            normalizedRadii.push(radius);
        }
    }

    // 6-10. initialize actual corner radii
    let upperLeft = null, upperRight = null, lowerRight = null, lowerLeft = null;
    if (cornerCount === 4) {
        [upperLeft, upperRight, lowerRight, lowerLeft] = normalizedRadii;
    } else if (cornerCount === 3) {
        upperLeft = normalizedRadii[0];
        upperRight = normalizedRadii[1];
        lowerLeft = normalizedRadii[1];
        lowerRight = normalizedRadii[2];
    } else if (cornerCount === 2) {
        upperLeft = normalizedRadii[0];
        lowerRight = normalizedRadii[0];
        upperRight = normalizedRadii[1];
        lowerLeft = normalizedRadii[1];
    } else {
        upperLeft = normalizedRadii[0];
        upperRight = normalizedRadii[0];
        lowerRight = normalizedRadii[0];
        lowerLeft = normalizedRadii[0];
    }

    // 11. prevent overlapping radii
    const top = upperLeft.x + upperRight.x;
    const right = upperRight.y + lowerRight.y;
    const bottom = lowerRight.x + lowerLeft.x;
    const left = upperLeft.y + lowerLeft.y;

    const scale = Math.min(w / top, h / right, w / bottom, h / left);

    if (scale < 1) {
        upperLeft.x *= scale;
        upperLeft.y *= scale;
        upperRight.x *= scale;
        upperRight.y *= scale;
        lowerLeft.x *= scale;
        lowerLeft.y *= scale;
        lowerRight.x *= scale;
        lowerRight.y *= scale;
    }

    // 12-13. create subpath
    const xw = x + w;
    const yh = y + h;

    ctx.moveTo(x + upperLeft.x, y);
    ctx.lineTo(xw - upperRight.x, y);
    ctx.quadraticCurveTo(xw, y, xw, y + upperRight.y);
    ctx.lineTo(xw, yh - lowerRight.y);
    ctx.quadraticCurveTo(xw, yh, xw - lowerRight.x, yh);
    ctx.lineTo(x + lowerLeft.x, yh);
    ctx.quadraticCurveTo(x, yh, x, yh - lowerLeft.y);
    ctx.lineTo(x, y + upperLeft.y);
    ctx.quadraticCurveTo(x, y, x + upperLeft.x, y);
    ctx.closePath();

    // XXX step 14 skipped; no subpath with (x, y) is created
}
