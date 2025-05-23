import { watchArrayField } from '../decorators/FlagFields.js';
import { PointerEvent } from '../events/PointerEvent.js';
import type { LayoutConstraints } from './LayoutConstraints.js';
import type { Widget } from '../widgets/Widget.js';
import type { TricklingEvent } from '../events/TricklingEvent.js';
import type { Rect } from '../helpers/Rect.js';
import type { Viewport } from './Viewport.js';
import { type BackingCanvasContext } from '../helpers/BackingCanvas.js';

export type ClippedViewportRect = [vpX: number, vpY: number, vpW: number, vpH: number, origXDst: number, origYDst: number, xDst: number, yDst: number, wClipped: number, hClipped: number];

/**
 * The base implementation of the {@link Viewport} interface. See
 * {@link CanvasViewport} and {@link ClippedViewport}.
 *
 * @category Core
 */
export abstract class BaseViewport implements Viewport {
    readonly relativeCoordinates: boolean;
    readonly child: Widget;
    abstract readonly context: BackingCanvasContext;
    @watchArrayField(BaseViewport.prototype.relayoutAndReposition)
    constraints: LayoutConstraints;
    @watchArrayField(BaseViewport.prototype.relayoutAndReposition)
    rect: Rect;
    abstract get effectiveScale(): [scaleX: number, scaleY: number];
    parent: Viewport | null = null;
    @watchArrayField(BaseViewport.prototype.updateChildPos)
    offset: [x: number, y: number];

    /** Has the warning for dimensionless canvases been issued? */
    protected static dimensionlessWarned = false;
    /** Has the warning for non-power of 2 dimensions been issued? */
    protected static powerOf2Warned = false;
    /**
     * The maximum retries allowed for
     * {@link Viewport#resolveLayout | resolving the layout}. The first attempt
     * is not counted. Only retries that exceed this limit are discarded; if
     * maxRelayout is 4, then the 5th retry will be discarded.
     */
    protected static maxRelayout = 4;
    /**
     * Should the layout be resolved, even if the child widget doesn't have a
     * dirty layout?
     */
    protected forceRelayout = true;

    protected constructor(child: Widget, relativeCoordinates: boolean) {
        this.child = child;
        this.relativeCoordinates = relativeCoordinates;
        this.constraints = [0, Infinity, 0, Infinity];
        this.rect = [0, 0, 0, 0];
        this.offset = [0, 0];
    }

    /**
     * Forces re-layout and calls {@link BaseViewport#updateChildPos}. Used as a
     * callback for the {@link BaseViewport#rect} field watcher.
     */
    private relayoutAndReposition() {
        this.forceRelayout = true;
        this.updateChildPos();
    }

    /**
     * Resolves the position of the child and finalizes its bounds. This
     * effectively updates the position of the child in an out-of-order fashion
     * (doesn't wait for the proper stage of the layout resolution). Used as a
     * callback for the {@link BaseViewport#offset} field watcher.
     */
    private updateChildPos() {
        if(!this.relativeCoordinates && this.child.attached) {
            const [l, t, _w, _h] = this.rect;
            const [ox, oy] = this.offset;
            const newX = l + ox;
            const newY = t + oy;
            const [oldX, oldY] = this.child.position;

            if(newX !== oldX || newY !== oldY) {
                this.child.resolvePosition(newX, newY);
                this.child.finalizeBounds();
            }
        }
    }

    /**
     * Resolves the given child's layout by calling
     * {@link Widget#resolveDimensions} with the current
     * {@link Viewport#constraints}, {@link Widget#resolvePosition} and
     * {@link Widget#finalizeBounds}.
     *
     * Handles both relative and absolute coordinates. The previous position is
     * used.
     *
     * @returns Returns true if the child was resized, else, false.
     */
    resolveLayout(): boolean {
        if(!(this.child.layoutDirty || this.forceRelayout)) {
            return false;
        }

        this.forceRelayout = false;

        // Resolve child's layout
        const [oldWidth, oldHeight] = this.child.dimensions;

        this.child.resolveDimensions(...this.constraints);

        if(this.relativeCoordinates) {
            this.child.resolvePosition(0, 0);
        } else {
            this.child.resolvePosition(...this.child.idealPosition);
        }

        this.child.finalizeBounds();

        const [newWidth, newHeight] = this.child.dimensions;
        return newWidth !== oldWidth || newHeight !== oldHeight;
    }

    abstract paint(extraDirtyRects: Array<Rect>): boolean;

    dispatchTricklingEvent(event: TricklingEvent): Widget | null {
        // Drop event if it is a positional event with no target outside the
        // child's viewport
        if(event instanceof PointerEvent) {
            const [cl, ct, cw, ch] = this.rect;
            const cr = cl + cw;
            const cb = ct + ch;

            if(event.target === null) {
                if(event.x < cl) {
                    return null;
                }
                if(event.x >= cr) {
                    return null;
                }
                if(event.y < ct) {
                    return null;
                }
                if(event.y >= cb) {
                    return null;
                }
            }

            // Correct position of pointer event if this viewport has relative
            // positions.
            if(this.relativeCoordinates) {
                const [ox, oy] = this.offset;
                const x = cl + ox;
                const y = ct + oy;

                if(x !== 0 || y !== 0) {
                    event = event.correctOffset(x, y);
                }
            }
        }

        return this.child.dispatchEvent(event);
    }

    /**
     * Get the rect of the child alongside more extra information,
     * clipped/clamped to the bounds of the viewport. Usually only for internal,
     * but can be used externally if you know what you're doing.
     */
    getClippedViewportRect(): ClippedViewportRect {
        // Calculate child's source and destination
        const [vpX, vpY, vpW, vpH] = this.rect;
        const [innerWidth, innerHeight] = this.child.dimensions;
        const [xOffset, yOffset] = this.offset;

        // viewport right and bottom
        const vpR = vpX + vpW;
        const vpB = vpY + vpH;

        // original child destination left and top
        const origXDst = vpX + xOffset;
        const origYDst = vpY + yOffset;

        // clipped child destination left, top, width and height
        const xDst = Math.min(Math.max(origXDst, vpX), vpR);
        const yDst = Math.min(Math.max(origYDst, vpY), vpB);
        const wClipped = Math.min(Math.max(origXDst + innerWidth, vpX), vpR) - xDst;
        const hClipped = Math.min(Math.max(origYDst + innerHeight, vpY), vpB) - yDst;

        return [vpX, vpY, vpW, vpH, origXDst, origYDst, xDst, yDst, wClipped, hClipped];
    }

    abstract markDirtyRect(rect: Rect): void;
}
