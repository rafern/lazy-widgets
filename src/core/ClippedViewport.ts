import type { FillStyle } from '../theme/FillStyle';
import type { Widget } from "../widgets/Widget";
import { BaseViewport } from "./BaseViewport";
import { Msg } from './Strings';

/**
 * A {@link Viewport} which inherits a rendering context from the closest parent
 * Viewport and paints {@link Widget | Widgets} by clipping them to the
 * Viewport's rectangle.
 *
 * @category Core
 */
export class ClippedViewport extends BaseViewport {
    get context(): CanvasRenderingContext2D {
        if(this.parent === null)
            throw Msg.PARENTLESS_CLIPVP;

        return this.parent.context;
    }

    get effectiveScale(): [scaleX: number, scaleY: number] {
        if(this.parent === null)
            throw Msg.PARENTLESS_CLIPVP;

        return this.parent.effectiveScale;
    }

    constructor(child: Widget) {
        super(child, false);
    }

    paint(force: boolean, backgroundFillStyle: FillStyle): boolean {
        const wasDirty = this.child.dirty;

        const [vpX, vpY, vpW, vpH, _origXDst, _origYDst, xDst, yDst, wClipped, hClipped] = this.getClippedViewport();
        const ctx = this.context;

        ctx.save();
        ctx.globalCompositeOperation = 'copy';
        ctx.fillStyle = backgroundFillStyle;
        ctx.beginPath();
        ctx.rect(vpX, vpY, vpW, vpH);
        ctx.clip();
        ctx.rect(xDst, yDst, wClipped, hClipped);
        ctx.clip('evenodd');
        ctx.fill();
        ctx.restore();

        // Abort if outside of bounds
        if(wClipped === 0 || hClipped === 0) {
            this.child.dryPaint();
            return wasDirty;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(vpX, vpY, vpW, vpH);
        ctx.clip();
        this.child.paint(force);
        ctx.restore();

        return wasDirty;
    }
}