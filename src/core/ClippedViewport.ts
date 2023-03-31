import { BaseViewport } from "./BaseViewport";
import { Msg } from './Strings';

import type { Rect } from '../helpers/Rect';
import type { Widget } from "../widgets/Widget";

/**
 * A {@link Viewport} which inherits a rendering context from the closest parent
 * Viewport and paints {@link Widget | Widgets} by clipping them to the
 * Viewport's rectangle.
 *
 * @category Core
 */
export class ClippedViewport extends BaseViewport {
    get context(): CanvasRenderingContext2D {
        if(this.parent === null) {
            throw Msg.PARENTLESS_CLIPVP;
        }

        return this.parent.context;
    }

    get effectiveScale(): [scaleX: number, scaleY: number] {
        if(this.parent === null) {
            throw Msg.PARENTLESS_CLIPVP;
        }

        return this.parent.effectiveScale;
    }

    constructor(child: Widget) {
        super(child, false);
    }

    paint(extraDirtyRects: Array<Rect>): boolean {
        const wasDirty = extraDirtyRects.length > 0;
        const [vpX, vpY, vpW, vpH, _origXDst, _origYDst, _xDst, _yDst, wClipped, hClipped] = this.getClippedViewport();

        // Abort if outside of bounds
        if(wClipped === 0 || hClipped === 0) {
            return wasDirty;
        }

        const ctx = this.context;
        ctx.save();
        ctx.beginPath();
        ctx.rect(vpX, vpY, vpW, vpH);
        ctx.clip();
        this.child.paint(extraDirtyRects);
        ctx.restore();

        return wasDirty;
    }

    // XXX clipped viewports don't care whether a rectangle was marked as dirty
    // or not, since they are always used in a viewport widget, which already
    // passes it along to the parent
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override markDirtyRect(_rect: Rect): void {}
}
