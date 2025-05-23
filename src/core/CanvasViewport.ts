import { flagField } from '../decorators/FlagFields.js';
import { roundToPower2 } from '../helpers/roundToPower2.js';
import { isPower2 } from '../helpers/isPower2.js';
import { BaseViewport, ClippedViewportRect } from './BaseViewport.js';
import { Msg } from './Strings.js';
import { mergeOverlappingRects } from '../helpers/mergeOverlappingRects.js';
import type { Widget } from '../widgets/Widget.js';
import type { Rect } from '../helpers/Rect.js';
import { type BackingCanvas, type BackingCanvasContext, createBackingCanvas } from '../helpers/BackingCanvas.js';

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
    readonly context: BackingCanvasContext;

    /** The internal canvas. Widgets are painted to this */
    readonly canvas: BackingCanvas;
    /** Current maximum canvas width. For internal use only. */
    private _maxCanvasWidth: number;
    /** Current maximum canvas height. For internal use only. */
    private _maxCanvasHeight: number;
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
     * Is texture atlas bleeding prevention enabled? If true, then a 1 pixel
     * fully transparent black border will be added around the canvas,
     * effectively reducing the usable canvas by 2 pixels horizontally and
     * vertically.
     *
     * Can only be set on CanvasViewport creation.
     */
    readonly preventAtlasBleeding: boolean;
    /**
     * Has the "real" size of the child Widget in the canvas shrunk? Used for
     * texture bleeding prevention. For internal use only.
     *
     * Will be ignored if {@link CanvasViewport#preventBleeding} is false.
     */
    private shrunk = false;
    /** The list of dirty rectangles, relative to the internal canvas. */
    private readonly dirtyRects: Array<Rect> = [];

    /**
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
    constructor(child: Widget, resolution = 1, preventBleeding = false, preventAtlasBleeding = false, startingWidth = 64, startingHeight = 64) {
        super(child, true);

        this.resolution = resolution;
        this.preventBleeding = preventBleeding;
        this.preventAtlasBleeding = preventAtlasBleeding;

        // Create internal canvas
        this.canvas = createBackingCanvas(startingWidth, startingHeight);

        this._maxCanvasWidth = 16384;
        this._maxCanvasHeight = 16384;

        // Get context out of canvas
        const context = this.canvas.getContext('2d', { alpha: true }) as BackingCanvasContext;
        if(context === null) {
            throw new Error(Msg.CANVAS_CONTEXT);
        }

        // TODO make kerning configurable while defaulting to 'normal' kerning
        //      like this instead of 'auto'. this will need changes to
        //      TextHelper and measureTextDims
        // XXX the default for this is 'auto', but this is inconsistent and WILL
        //     cause rendering issues in some environments like some types of
        //     PWAs
        context.fontKerning = 'normal';

        this.context = context;
    }

    /**
     * The maximum width the {@link CanvasViewport#canvas} can have. If the
     * layout exceeds this width, then the content will be scaled to fit the
     * canvas.
     *
     * Non-integer numbers will be rounded.
     */
    get maxCanvasWidth(): number {
        return this._maxCanvasWidth;
    }

    set maxCanvasWidth(maxCanvasWidth: number) {
        let autoRounded = false;
        if (!Number.isInteger(maxCanvasWidth)) {
            maxCanvasWidth = Math.round(maxCanvasWidth);
            autoRounded = true;
        }

        if (maxCanvasWidth !== this._maxCanvasWidth) {
            this._maxCanvasWidth = maxCanvasWidth;
            this._forceResize = true;

            if (autoRounded) {
                console.warn('maxCanvasWidth is not whole. Auto-rounded');
            }
        }
    }

    /**
     * The maximum height the {@link CanvasViewport#canvas} can have. If the
     * layout exceeds this height, then the content will be scaled to fit the
     * canvas.
     *
     * Non-integer numbers will be rounded.
     */
    get maxCanvasHeight(): number {
        return this._maxCanvasHeight;
    }

    set maxCanvasHeight(maxCanvasHeight: number) {
        let autoRounded = false;
        if (!Number.isInteger(maxCanvasHeight)) {
            maxCanvasHeight = Math.round(maxCanvasHeight);
            autoRounded = true;
        }

        if (maxCanvasHeight !== this._maxCanvasHeight) {
            this._maxCanvasHeight = maxCanvasHeight;
            this._forceResize = true;

            if (autoRounded) {
                console.warn('maxCanvasHeight is not whole. Auto-rounded');
            }
        }
    }

    /**
     * The current dimensions of the
     * {@link CanvasViewport#canvas | internal canvas}
     */
    get canvasDimensions(): [number, number] {
        return [this.canvas.width, this.canvas.height];
    }

    /**
     * The current usable dimensions of the
     * {@link CanvasViewport#canvas | internal canvas}. If
     * {@link CanvasViewport#preventAtlasBleeding} is false, then this will be
     * equivalent to {@link CanvasViewport#canvasDimensions}.
     */
    get usableCanvasDimensions(): [number, number] {
        if (this.preventAtlasBleeding) {
            return [this.canvas.width - 2, this.canvas.height - 2];
        } else {
            return this.canvasDimensions;
        }
    }

    /**
     * The usable maximum width of the
     * {@link CanvasViewport#canvas | internal canvas}. If
     * {@link CanvasViewport#preventAtlasBleeding} is false, then this will be
     * equivalent to {@link CanvasViewport#maxCanvasWidth}.
     */
    get usableMaxCanvasWidth(): number {
        if (this.preventAtlasBleeding) {
            return this.maxCanvasWidth - 2;
        } else {
            return this.maxCanvasWidth;
        }
    }

    /**
     * The usable maximum height of the
     * {@link CanvasViewport#canvas | internal canvas}. If
     * {@link CanvasViewport#preventAtlasBleeding} is false, then this will be
     * equivalent to {@link CanvasViewport#maxCanvasHeight}.
     */
    get usableMaxCanvasHeight(): number {
        if (this.preventAtlasBleeding) {
            return this.maxCanvasHeight - 2;
        } else {
            return this.maxCanvasHeight;
        }
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

            if(oldRealWidth > realWidth || oldRealHeight > realHeight) {
                this.shrunk = true;
            }

            // Canvas dimensions are rounded to the nearest power of 2, favoring
            // bigger powers. This is to avoid issues with mipmapping, which
            // requires texture sizes to be powers of 2. Make sure that the
            // maximum canvas dimensions aren't exceeded
            const [newUnscaledWidth, newUnscaledHeight] = this.child.dimensions;
            let newWidth = newUnscaledWidth * this.resolution;
            let newHeight = newUnscaledHeight * this.resolution;

            if (this.preventAtlasBleeding) {
                newWidth += 2;
                newHeight += 2;
            }

            const newCanvasWidth = Math.min(Math.max(roundToPower2(newWidth), this.canvas.width), this.maxCanvasWidth);
            const newCanvasHeight = Math.min(Math.max(roundToPower2(newHeight), this.canvas.height), this.maxCanvasHeight);

            let usableNewCanvasWidth = newCanvasWidth;
            let usableNewCanvasHeight = newCanvasHeight;

            if (this.preventAtlasBleeding) {
                usableNewCanvasWidth -= 2;
                usableNewCanvasHeight -= 2;
            }

            if(usableNewCanvasWidth === 0 || usableNewCanvasHeight === 0) {
                if(!BaseViewport.dimensionlessWarned) {
                    BaseViewport.dimensionlessWarned = true;
                    console.warn(Msg.DIMENSIONLESS_CANVAS);
                }
            } else if(!isPower2(newCanvasWidth) || !isPower2(newCanvasHeight)) {
                if(!BaseViewport.powerOf2Warned) {
                    BaseViewport.powerOf2Warned = true;
                    console.warn(Msg.NON_POW2_CANVAS);
                }
            }

            // XXX repaint whole canvas if the canvas was resized with a new
            // scale. when copying using different scales, some artifacts are
            // introduced. fix this by re-painting everything. since we're
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
                // bounds need to be finalized again because the scale just
                // changed and so the ideal dimensions need to be re-rounded
                this.child.finalizeBounds();
                this.markWholeAsDirty();
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
                    copyCanvas = createBackingCanvas(oldCanvasWidth, oldCanvasHeight);

                    const copyCtx = copyCanvas.getContext('2d') as BackingCanvasContext;
                    if(copyCtx === null) {
                        throw new Error(Msg.CANVAS_CONTEXT);
                    }

                    copyCtx.globalCompositeOperation = 'copy';
                    copyCtx.drawImage(
                        this.canvas,
                        0, 0, oldCanvasWidth, oldCanvasHeight,
                        0, 0, oldCanvasWidth, oldCanvasHeight,
                    );
                }

                this.canvas.width = newCanvasWidth;
                this.canvas.height = newCanvasHeight;
                // XXX resizing a canvas restores THE WHOLE CONTEXT, not just
                //     the pixel data, unlike what MDN implies as of writing
                //     this comment. because of this, we need to set the font
                //     kerning to 'normal' again, otherwise it's going to be set
                //     to 'auto'
                this.context.fontKerning = 'normal';
                this.markWholeAsDirty();

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
            Math.min(this.usableMaxCanvasWidth / width, this.resolution),
            Math.min(this.usableMaxCanvasHeight / height, this.resolution)
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
            Math.min(this.usableMaxCanvasWidth, Math.ceil(width * this.resolution)),
            Math.min(this.usableMaxCanvasHeight, Math.ceil(height * this.resolution))
        ];
    }

    /**
     * Add a clipping rectangle to the internal canvas context.
     */
    private clipToRect(rect: Rect) {
        const [left, top, width, height] = rect;
        const right = left + width;
        const bottom = top + height;
        this.context.moveTo(left, top);
        this.context.lineTo(right, top);
        this.context.lineTo(right, bottom);
        this.context.lineTo(left, bottom);
    }

    /**
     * Merge all overlapping dirty rectangles and clear the dirty rectangle
     * list.
     *
     * @returns Returns the list of merged rectangles.
     */
    protected mergedDirtyRects(): Array<Rect> {
        const dirtyRects = mergeOverlappingRects(this.dirtyRects);
        this.dirtyRects.length = 0;

        const [maxRight, maxBottom] = this.usableCanvasDimensions;

        // fix out-of-bounds rects and filter 0-sized dirty rects
        for (let i = dirtyRects.length - 1; i >= 0; i--) {
            const dirtyRect = dirtyRects[i];

            // disallow negative offsets
            if (dirtyRect[0] < 0) {
                dirtyRect[2] += dirtyRect[0];
                dirtyRect[0] = 0;
            }

            if (dirtyRect[1] < 0) {
                dirtyRect[3] += dirtyRect[1];
                dirtyRect[1] = 0;
            }

            // clamp right and bottom
            if (dirtyRect[0] + dirtyRect[2] > maxRight) {
                dirtyRect[2] = maxRight - dirtyRect[0];
            }

            if (dirtyRect[1] + dirtyRect[3] > maxBottom) {
                dirtyRect[3] = maxBottom - dirtyRect[1];
            }

            // cull 0-sized rects
            if (dirtyRect[2] <= 0 || dirtyRect[3] <= 0) {
                dirtyRects.splice(i, 1);
            }
        }

        return dirtyRects;
    }

    /**
     * Implements {@link Viewport#paint}, but only paints to the
     * {@link CanvasViewport#canvas | internal canvas}. Call this instead of
     * {@link Viewport#paint} if you are using this Viewport's canvas as the
     * output canvas (such as in the {@link Root}).
     */
    paintToInternal(): null | Array<Rect> {
        // check if there are any parts that need to be repainted
        const dirtyRects = this.mergedDirtyRects();
        let canvasSpaceDirtyRects: null | Array<Rect> = null;

        if (dirtyRects.length > 0) {
            // clip to dirty rectangles (and translate if using atlas bleeding
            // prevention)
            this.context.save();

            if (this.preventAtlasBleeding) {
                this.context.translate(1, 1);
            }

            this.context.beginPath();
            for (const dirtyRect of dirtyRects) {
                this.clipToRect(dirtyRect);
            }

            this.context.clip();

            // clear dirty area
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // scale canvas if child dimensions exceed maximum canvas dimensions
            const [scaleX, scaleY] = this.effectiveScale;
            const needsScale = scaleX !== 1 || scaleY !== 1;
            if(needsScale) {
                this.context.scale(scaleX, scaleY);
            }

            // paint child
            const absDirtyRects: Rect[] = [];
            for (const dirtyRect of dirtyRects) {
                absDirtyRects.push([
                    dirtyRect[0] / scaleX, dirtyRect[1] / scaleY,
                    dirtyRect[2] / scaleX, dirtyRect[3] / scaleY
                ]);
            }

            this.child.paint(absDirtyRects);

            // stop clipping/scaling
            this.context.restore();

            // generate list of dirty rects in canvas-space coordinates
            canvasSpaceDirtyRects = dirtyRects;
            if (this.preventAtlasBleeding) {
                for (const dirtyRect of canvasSpaceDirtyRects) {
                    dirtyRect[0] += 1;
                    dirtyRect[1] += 1;
                }
            }
        }

        // prevent bleeding by clearing out-of-bounds parts of canvas
        if(this.preventBleeding && this.shrunk) {
            this.shrunk = false;
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            const [realWidth, realHeight] = this.realDimensions;

            // XXX set returned dirty rects to a single rect covering the whole
            //     canvas, otherwise, there will be too many rects to be useful
            //     for texture sub-region updates
            canvasSpaceDirtyRects = [[0, 0, canvasWidth, canvasHeight]];

            if (this.preventAtlasBleeding) {
                // clear top and left borders
                this.context.clearRect(0, 0, canvasWidth, 1);
                this.context.clearRect(0, 1, 1, canvasHeight - 1);

                // clear rest
                const rightSpace = canvasWidth - realWidth - 1;
                const bottomSpace = canvasHeight - realHeight - 1;

                if(rightSpace > 0 && bottomSpace > 0) {
                    // clear right and bottom. do this by clearing a small
                    // rectangle on the right and a big rectangle on the bottom
                    this.context.clearRect(realWidth + 1, 1, rightSpace, realHeight);
                    this.context.clearRect(1, realHeight + 1, canvasWidth - 1, bottomSpace);
                } else if(rightSpace > 0) {
                    // clear right
                    this.context.clearRect(realWidth + 1, 1, rightSpace, canvasHeight - 1);
                } else if(bottomSpace > 0) {
                    // clear bottom
                    this.context.clearRect(1, realHeight + 1, canvasWidth - 1, bottomSpace);
                }
            } else {
                const rightSpace = canvasWidth - realWidth;
                const bottomSpace = canvasHeight - realHeight;

                if(rightSpace > 0 && bottomSpace > 0) {
                    // clear right and bottom. same approach as before
                    this.context.clearRect(realWidth, 0, rightSpace, realHeight);
                    this.context.clearRect(0, realHeight, canvasWidth, bottomSpace);
                } else if(rightSpace > 0) {
                    // clear right
                    this.context.clearRect(realWidth, 0, rightSpace, canvasHeight);
                } else if(bottomSpace > 0) {
                    // clear bottom
                    this.context.clearRect(0, realHeight, canvasWidth, bottomSpace);
                }
            }
        }

        return canvasSpaceDirtyRects;
    }

    /**
     * Paints the internal canvas to the
     * {@link CanvasViewport#parent | parent viewport}. Note that you are
     * assumed to have already called {@link CanvasViewport#paintToInternal},
     * and must pass the {@link ClippedViewportRect} from
     * {@link CanvasViewport#getClippedViewportRect}.
     *
     * You probably don't need to call this. Check {@link CanvasViewport#paint}
     * instead.
     */
    paintToParentViewport(clippedViewportRect: Readonly<ClippedViewportRect>, clip = true) {
        const wClipped = clippedViewportRect[8];
        const hClipped = clippedViewportRect[9];

        if(this.parent === null || wClipped === 0 || hClipped === 0) {
            return;
        }

        const [esx, esy] = this.effectiveScale;
        const ctx = this.parent.context;

        if (clip) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(clippedViewportRect[0], clippedViewportRect[1], clippedViewportRect[2], clippedViewportRect[3]);
            ctx.clip();
        }

        const xDst = clippedViewportRect[6];
        const yDst = clippedViewportRect[7];
        let sx = (xDst - clippedViewportRect[4]) * esx;
        let sy = (yDst - clippedViewportRect[5]) * esy;

        if (this.preventAtlasBleeding) {
            sx++;
            sy++;
        }

        ctx.drawImage(
            this.canvas,
            sx,
            sy,
            wClipped * esx,
            hClipped * esy,
            xDst,
            yDst,
            wClipped,
            hClipped,
        );

        if (clip) {
            ctx.restore();
        }
    }

    /**
     * Paint the {@link Viewport#child} to the {@link Viewport#context} and, if
     * it makes sense to do so, paint to the {@link Viewport#parent} Viewport's
     * context.
     *
     * Nothing is done if the child was not re-painted.
     *
     * Note that, unlike other Viewport implementations, this implementation
     * doesn't actually need to have extraDirtyRects passed; an empty array will
     * suffice, assuming you're marking dirty regions with
     * {@link CanvasViewport#pushDirtyRects}.
     *
     * @param _extraDirtyRects - Ignored in this Viewport implementation, but would otherwise have the damage regions that need to be repainted.
     * @returns Returns true if the child was re-painted, else, false.
     */
    override paint(_extraDirtyRects: ReadonlyArray<Rect>): boolean {
        const clippedViewportRect = this.getClippedViewportRect();

        // paint to internal canvas
        const dirtyRects = this.paintToInternal();

        // Paint to parent viewport, if any, and if inside bounds
        this.paintToParentViewport(clippedViewportRect);

        return dirtyRects !== null;
    }

    pushDirtyRects(rects: Array<Rect>) {
        this.dirtyRects.push(...rects);
    }

    pushDirtyRect(rect: Rect) {
        this.dirtyRects.push(rect);
    }

    override markDirtyRect(rect: Rect) {
        const [scaleX, scaleY] = this.effectiveScale;
        if (scaleX !== 1 || scaleY !== 1) {
            const [left, top, width, height] = rect;
            const scaledLeft = Math.floor(left * scaleX);
            const scaledTop = Math.floor(top * scaleY);
            const scaledRight = Math.ceil((left + width) * scaleX);
            const scaledBottom = Math.ceil((top + height) * scaleY);
            rect = [scaledLeft, scaledTop, scaledRight - scaledLeft, scaledBottom - scaledTop];
        }

        this.pushDirtyRect(rect);
    }

    markWholeAsDirty() {
        this.pushDirtyRect([0, 0, this.canvas.width, this.canvas.height]);
    }
}
