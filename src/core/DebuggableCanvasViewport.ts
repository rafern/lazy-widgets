import type { Rect } from '../helpers/Rect';
import type { Widget } from '../widgets/Widget';
import { CanvasViewport } from './CanvasViewport';
import { Msg } from './Strings';

type DebugEvent = [ rect: Rect, timestamp: number, isMerged: boolean ];
const DEBUG_EVENT_TIMEOUT = 1000;

export class DebuggableCanvasViewport extends CanvasViewport {
    /** The overlay canvas. Dirty rects are painted to this */
    readonly overlayCanvas: HTMLCanvasElement;
    /** The overlay canvas's context */
    readonly overlayContext: CanvasRenderingContext2D;
    /** The internal canvas with the overlay applied on top of it (output) */
    readonly outputCanvas: HTMLCanvasElement;
    /** The output canvas's context */
    readonly outputContext: CanvasRenderingContext2D;
    /** The list of recently pushed dirty rects, with their timestamps */
    readonly events = new Set<DebugEvent>();
    /** Is the overlay enabled? Disabled by default */
    private _overlayEnabled = false;

    constructor(child: Widget, resolution = 1, preventBleeding = false, startingWidth = 64, startingHeight = 64) {
        super(child, resolution, preventBleeding, startingWidth, startingHeight);

        // make overlay canvas
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.width = startingWidth;
        this.overlayCanvas.height = startingHeight;

        // get context out of overlay canvas
        const overlayContext = this.overlayCanvas.getContext('2d', { alpha: true });
        if(overlayContext === null) {
            throw new Error(Msg.CANVAS_CONTEXT);
        }

        this.overlayContext = overlayContext;

        // make output canvas
        this.outputCanvas = document.createElement('canvas');
        this.outputCanvas.width = startingWidth;
        this.outputCanvas.height = startingHeight;

        // get context out of output canvas
        const outputContext = this.outputCanvas.getContext('2d', { alpha: true });
        if(outputContext === null) {
            throw new Error(Msg.CANVAS_CONTEXT);
        }

        this.outputContext = outputContext;
    }

    get overlayEnabled(): boolean {
        return this._overlayEnabled;
    }

    set overlayEnabled(overlayEnabled: boolean) {
        if (overlayEnabled === this._overlayEnabled) {
            return;
        }

        this._overlayEnabled = overlayEnabled;
        this.updateOutputCanvas();
    }

    protected override mergedDirtyRects(): Array<Rect> {
        // intercept merged dirty rectangles
        const merged = super.mergedDirtyRects();

        for (const rect of merged) {
            this.addDebugEvent(rect, true);
        }

        return merged;
    }

    updateOutputCanvas() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // generate overlay
        if (this._overlayEnabled) {
            this.overlayContext.clearRect(0, 0, width, height);
            this.overlayContext.globalCompositeOperation = 'lighter';

            const expired: Array<DebugEvent> = [];
            const now = Date.now();
            for (const event of this.events) {
                const animDelta = (now - event[1]) / DEBUG_EVENT_TIMEOUT;

                if (animDelta >= 1) {
                    expired.push(event);
                    continue;
                }

                this.overlayContext.fillStyle = `rgba(${event[2] ? 0 : 255}, 0, ${event[2] ? 255 : 0}, ${1 - animDelta})`;
                this.overlayContext.fillRect(...event[0]);
            }

            for (const event of expired) {
                this.events.delete(event);
            }
        }

        // merge internal canvas and overlay
        this.outputContext.globalAlpha = 1;
        this.outputContext.globalCompositeOperation = 'copy';
        this.outputContext.drawImage(this.canvas, 0, 0);

        if (this._overlayEnabled) {
            this.outputContext.globalAlpha = 0.5;
            this.outputContext.globalCompositeOperation = 'source-over';
            this.outputContext.drawImage(this.overlayCanvas, 0, 0);
        }
    }

    private addDebugEvent(rect: Rect, isMerged: boolean) {
        // intercept dirty rectangles
        const event: DebugEvent = [ rect, Date.now(), isMerged ];

        if (this.events) {
            this.events.add(event);
        } else {
            // HACK CanvasViewport calls pushDirtyRect in the constructor, so we
            // might not be ready when this method is called. queue it up with a
            // setTimeout
            setTimeout(() => this.events.add(event), 0);
        }
    }

    protected override pushDirtyRect(rect: Rect) {
        super.pushDirtyRect(rect);
        this.addDebugEvent(rect, false);
    }

    override resolveLayout(): boolean {
        const oldW = this.canvas.width;
        const oldH = this.canvas.height;

        const wasResized = super.resolveLayout();

        const newW = this.canvas.width;
        const newH = this.canvas.height;
        if (oldW !== newW || oldH !== newH) {
            this.overlayCanvas.width = newW;
            this.overlayCanvas.height = newH;
            this.outputCanvas.width = newW;
            this.outputCanvas.height = newH;
        }

        return wasResized;
    }

    override paintToInternal(force: boolean): boolean {
        const wasDirty = super.paintToInternal(force);

        if (this._overlayEnabled) {
            this.updateOutputCanvas();
            return true;
        } else {
            if (wasDirty) {
                this.updateOutputCanvas();
            }

            return wasDirty;
        }
    }
}
