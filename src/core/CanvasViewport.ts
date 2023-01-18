import { flagField, paintField } from '../decorators/FlagFields';
import { roundToPower2 } from '../helpers/roundToPower2';
import type { FillStyle } from '../theme/FillStyle';
import type { Widget } from '../widgets/Widget';
import { isPower2 } from '../helpers/isPower2';
import { BaseViewport } from './BaseViewport';
import { Msg } from './Strings';

/**
 * A {@link Viewport} with an internal canvas, where the rendering context used
 * for the Viewport is the internal canvas' context instead of an inherited
 * context from a parent Viewport.
 *
 * Mostly used as the top-most Viewport, such as the Viewport in a {@link Root}.
 *
 * Coordinates are relative to the internal canvas, instead of absolute. Because
 * of this, viewport contents may be blurred if the position of the viewport is
 * fractional.
 *
 * @category Core
 */
export class CanvasViewport extends BaseViewport {
    readonly context: CanvasRenderingContext2D;

    /** The internal canvas. Widgets are painted to this */
    readonly canvas: HTMLCanvasElement;
    /**
     * The maximum width the {@link CanvasViewport#canvas} can have. If the
     * layout exceeds this width, then the content will be scaled to fit the
     * canvas
     */
    @paintField
    maxCanvasWidth = 16384;
    /**
     * The maximum height the {@link CanvasViewport#canvas} can have. If the
     * layout exceeds this height, then the content will be scaled to fit the
     * canvas
     */
    @paintField
    maxCanvasHeight = 16384;
    /**
     * The resolution of the canvas. If possible, the canvas will be scaled by
     * this amount.
     */
    @flagField('_forceResize')
    resolution: number;
    /** Does the canvas size need to be updated? For internal use only. */
    protected _forceResize = true;
    /** Previous horizontal effective scale. For internal use only. */
    private _prevESX = 1;
    /** Previous vertical effective scale. For internal use only. */
    private _prevESY = 1;
    /**
     * Is texture bleeding prevention enabled? If true, then out-of-bounds old
     * painted Widgets that were kept because of the canvas shrinking will be
     * cleared after the paint method is called.
     *
     * Can be changed at any time, but will only take effect once the
     * {@link Viewport#child} Widget is re-painted.
     */
    preventBleeding: boolean;
    /**
     * Has the "real" size of the child Widget in the canvas shrunk? Used for
     * texture bleeding prevention. For internal use only.
     *
     * Will be ignored if {@link CanvasViewport#preventBleeding} is false.
     */
    private shrunk = false;

    /**
     * Create a new CanvasViewport.
     *
     * Creates a new canvas with a starting width and height, setting
     * {@link CanvasViewport#canvas} and {@link Viewport#context}. Failure to
     * get a canvas context results in an exception.
     *
     * Texture bleeding prevention should be enabled for CanvasViewports that
     * are used as the output (top-most) Viewport, but only if the Viewport will
     * be used in a 3D engine. If used in, for example, a {@link DOMRoot}, then
     * there should be no texture bleeding issues, so texture bleeding
     * prevention is disabled for DOMRoots. For engines like Wonderland Engine,
     * texture bleeding prevention is enabled.
     *
     * Should not be used in nested Viewports as there are no texture bleeding
     * issues in nested Viewports; it technically can be enabled, but it would
     * be a waste of resources.
     */
    constructor(child: Widget, resolution = 1, preventBleeding = false, startingWidth = 64, startingHeight = 64) {
        super(child, true);

        this.resolution = resolution;
        this.preventBleeding = preventBleeding;

        // Create internal canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = startingWidth;
        this.canvas.height = startingHeight;

        // Get context out of canvas
        const context = this.canvas.getContext('2d', { alpha: true });
        if(context === null)
            throw new Error(Msg.CANVAS_CONTEXT);

        this.context = context;
        this.child.forceDirty();
    }

    /**
     * The current dimensions of the
     * {@link CanvasViewport#canvas | internal canvas}
     */
    get canvasDimensions(): [number, number] {
        return [this.canvas.width, this.canvas.height];
    }

    /**
     * Resolves the Viewport child's layout (including position) in one call,
     * using the previous position.
     *
     * May resize or rescale the canvas.
     *
     * Expands {@link CanvasViewport#canvas} if the new layout is too big for
     * the current canvas. Expansion is done in powers of 2 to avoid issues with
     * external 3D libraries.
     *
     * @returns Returns true if the widget or canvas were resized, or the canvas rescaled, else, false.
     */
    override resolveLayout(): boolean {
        const [oldRealWidth, oldRealHeight] = this.realDimensions;

        let wasResized = super.resolveLayout();

        // Re-scale canvas if neccessary.
        if(wasResized || this._forceResize) {
            this._forceResize = false;

            const [realWidth, realHeight] = this.realDimensions;

            if(oldRealWidth > realWidth || oldRealHeight > realHeight)
                this.shrunk = true;

            // Canvas dimensions are rounded to the nearest power of 2, favoring
            // bigger powers. This is to avoid issues with mipmapping, which
            // requires texture sizes to be powers of 2. Make sure that the
            // maximum canvas dimensions aren't exceeded
            const [newUnscaledWidth, newUnscaledHeight] = this.child.dimensions;
            const newWidth = newUnscaledWidth * this.resolution;
            const newHeight = newUnscaledHeight * this.resolution;
            const newCanvasWidth = Math.min(Math.max(roundToPower2(newWidth), this.canvas.width), this.maxCanvasWidth);
            const newCanvasHeight = Math.min(Math.max(roundToPower2(newHeight), this.canvas.height), this.maxCanvasHeight);

            if(newCanvasWidth === 0 || newCanvasHeight === 0) {
                if(!BaseViewport.dimensionlessWarned) {
                    BaseViewport.dimensionlessWarned = true;
                    console.warn(Msg.DIMENSIONLESS_CANVAS);
                }
            }
            else if(!isPower2(newCanvasWidth) || !isPower2(newCanvasHeight)) {
                if(!BaseViewport.powerOf2Warned) {
                    BaseViewport.powerOf2Warned = true;
                    console.warn(Msg.NON_POW2_CANVAS);
                }
            }

            // XXX force-mark child as dirty if the canvas was resized with a
            // new scale. when copying using different scales, some artifacts
            // are introduced. fix this by re-painting everything. since we're
            // re-painting, theres no need to copy the old canvas contents
            const oldCanvasWidth = this.canvas.width;
            const oldCanvasHeight = this.canvas.height;
            const [newESX, newESY] = this.effectiveScale;
            let needsCopying = oldCanvasWidth !== 0 && oldCanvasHeight !== 0;
            if(newESX !== this._prevESX || newESY !== this._prevESY) {
                this._prevESX = newESX;
                this._prevESY = newESY;
                needsCopying = false;
                wasResized = true;
                this.child.forceDirty(false);
                // bounds need to be finalized again because the scale just
                // changed and so the ideal dimensions need to be re-rounded
                this.child.finalizeBounds();
            }

            if(newCanvasWidth !== oldCanvasWidth || newCanvasHeight !== oldCanvasHeight) {
                // Resizing a canvas clears its contents. To mitigate this, copy
                // the canvas contents to a new canvas, resize the canvas and
                // copy the contents back. To avoid unnecessary copying, the
                // canvas will not be copied if the old dimensions of the child
                // were 0x0
                // TODO resizing is kinda expensive. maybe find a better way?
                wasResized = true;
                let copyCanvas = null;

                if(needsCopying) {
                    copyCanvas = document.createElement('canvas');
                    copyCanvas.width = oldCanvasWidth;
                    copyCanvas.height = oldCanvasHeight;

                    const copyCtx = copyCanvas.getContext('2d');
                    if(copyCtx === null)
                        throw new Error(Msg.CANVAS_CONTEXT);

                    copyCtx.globalCompositeOperation = 'copy';
                    copyCtx.drawImage(
                        this.canvas,
                        0, 0, oldCanvasWidth, oldCanvasHeight,
                        0, 0, oldCanvasWidth, oldCanvasHeight,
                    );
                }

                this.canvas.width = newCanvasWidth;
                this.canvas.height = newCanvasHeight;

                if(copyCanvas !== null) {
                    this.context.globalCompositeOperation = 'copy';
                    this.context.drawImage(
                        copyCanvas,
                        0, 0, copyCanvas.width, copyCanvas.height,
                        0, 0, Math.min(copyCanvas.width, this.maxCanvasWidth), Math.min(copyCanvas.height, this.maxCanvasHeight),
                    );
                    this.context.globalCompositeOperation = 'source-over';
                }
            }
        }

        return wasResized;
    }

    get effectiveScale(): [scaleX: number, scaleY: number] {
        const [width, height] = this.child.dimensions;

        return [
            Math.min(this.maxCanvasWidth / width, this.resolution),
            Math.min(this.maxCanvasHeight / height, this.resolution)
        ];
    }

    /**
     * The "real" dimensions of the child Widget; the dimensions that the child
     * Widget occupies in the canvas, taking resolution and maximum canvas
     * dimensions into account.
     */
    private get realDimensions(): [width: number, height: number] {
        const [width, height] = this.child.dimensions;

        return [
            Math.min(this.maxCanvasWidth, Math.ceil(width * this.resolution)),
            Math.min(this.maxCanvasHeight, Math.ceil(height * this.resolution))
        ];
    }

    /**
     * Implements {@link Viewport#paint}, but only paints to the
     * {@link CanvasViewport#canvas | internal canvas}. Call this instead of
     * {@link Viewport#paint} if you are using this Viewport's canvas as the
     * output canvas (such as in the {@link Root}).
     */
    paintToInternal(force: boolean): boolean {
        // Paint child
        const wasDirty = this.child.dirty;

        // scale canvas if child dimensions exceed maximum canvas dimensions
        const [scaleX, scaleY] = this.effectiveScale;
        const needsScale = scaleX !== 1 || scaleY !== 1;
        if(needsScale) {
            this.context.save();
            this.context.scale(scaleX, scaleY);
        }

        this.child.paint(force);

        if(needsScale)
            this.context.restore();

        // prevent bleeding by clearing out-of-bounds parts of canvas
        if(this.preventBleeding && this.shrunk) {
            this.shrunk = false;

            const [realWidth, realHeight] = this.realDimensions;
            const rightSpace = this.maxCanvasWidth - realWidth;
            const bottomSpace = this.maxCanvasHeight - realHeight;

            if(rightSpace > 0 && bottomSpace > 0) {
                // clear right and bottom. do this by clearing a small rectangle
                // on the right and a big rectangle on the bottom
                this.context.clearRect(realWidth, 0, rightSpace, realHeight);
                this.context.clearRect(0, realHeight, this.maxCanvasWidth, this.maxCanvasHeight);
            }
            else if(rightSpace > 0) {
                // clear right
                this.context.clearRect(realWidth, 0, rightSpace, this.maxCanvasHeight);
            }
            else if(bottomSpace > 0) {
                // clear bottom
                this.context.clearRect(0, realHeight, this.maxCanvasWidth, this.maxCanvasHeight);
            }
        }

        return wasDirty;
    }

    paint(force: boolean, backgroundFillStyle: FillStyle): boolean {
        const wasDirty = this.paintToInternal(force);

        // Paint to parent viewport, if any
        if(this.parent !== null) {
            const [vpX, vpY, vpW, vpH, origXDst, origYDst, xDst, yDst, wClipped, hClipped] = this.getClippedViewport();
            const ctx = this.parent.context;

            ctx.save();
            ctx.globalCompositeOperation = 'copy';
            ctx.fillStyle = backgroundFillStyle;
            ctx.beginPath();
            ctx.rect(vpX, vpY, vpW, vpH);
            ctx.clip();

            // Don't paint if outside of bounds
            if(wClipped !== 0 && hClipped !== 0) {
                const [esx, esy] = this.effectiveScale;

                ctx.drawImage(
                    this.canvas,
                    (xDst - origXDst) * esx,
                    (yDst - origYDst) * esy,
                    wClipped * esx,
                    hClipped * esy,
                    xDst,
                    yDst,
                    wClipped,
                    hClipped,
                );
            }

            ctx.rect(xDst, yDst, wClipped, hClipped);
            ctx.clip('evenodd');
            ctx.fill();
            ctx.restore();
        }

        return wasDirty;
    }
}