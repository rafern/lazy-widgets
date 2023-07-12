import { CanvasViewport } from './CanvasViewport.js';
import { Msg } from './Strings.js';
import type { Rect } from '../helpers/Rect.js';
import type { Widget } from '../widgets/Widget.js';
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
    /** Does the overlay need to be updated? */
    private _overlayDirty = false;
    /** When was the last time the PPS was measured? */
    private _lastPPSMeasurement = 0;
    /** Current PPS text value */
    private _ppsText = 'PPS: measuring...';
    /** Paints since last measurement */
    private _paintCounter = 0;

    constructor(child: Widget, resolution = 1, preventBleeding = false, preventAtlasBleeding = false, startingWidth = 64, startingHeight = 64) {
        super(child, resolution, preventBleeding, preventAtlasBleeding, startingWidth, startingHeight);

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
            // draw damage
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

                if (this.preventAtlasBleeding) {
                    const rect = event[0];
                    this.overlayContext.fillRect(
                        rect[0] + 1, rect[1] + 1, rect[2], rect[3]
                    );
                } else {
                    this.overlayContext.fillRect(...event[0]);
                }
            }

            for (const event of expired) {
                this.events.delete(event);
            }

            // update overlay dirty flag
            this._overlayDirty = this.events.size > 0;
        }

        // merge internal canvas and overlay
        this.outputContext.globalAlpha = 1;
        this.outputContext.globalCompositeOperation = 'copy';
        this.outputContext.drawImage(this.canvas, 0, 0);

        if (this._overlayEnabled) {
            // apply overlay
            this.outputContext.globalAlpha = 0.5;
            this.outputContext.globalCompositeOperation = 'source-over';
            this.outputContext.drawImage(this.overlayCanvas, 0, 0);

            // paint PPS text
            this.outputContext.save();
            this.outputContext.globalAlpha = 1;
            this.outputContext.globalCompositeOperation = 'source-over';
            this.outputContext.lineWidth = 4;
            this.outputContext.textBaseline = 'top';
            this.outputContext.font = '16px sans-serif';
            this.outputContext.strokeStyle = 'black';
            this.outputContext.fillStyle = 'white';

            const xy = this.preventAtlasBleeding ? 9 : 8;

            this.outputContext.strokeText(this._ppsText, xy, xy);
            this.outputContext.fillText(this._ppsText, xy, xy);
            this.outputContext.restore();
        }
    }

    private addDebugEvent(rect: Rect, isMerged: boolean) {
        // intercept dirty rectangles
        const event: DebugEvent = [ [...rect], Date.now(), isMerged ];

        if (this.events) {
            this.events.add(event);
            this._overlayDirty = true;
        } else {
            // HACK CanvasViewport calls pushDirtyRect in the constructor, so we
            // might not be ready when this method is called. queue it up with a
            // setTimeout
            setTimeout(() => {
                this.events.add(event);
                this._overlayDirty = true;
            }, 0);
        }
    }

    protected override pushDirtyRects(rects: Array<Rect>) {
        for (const rect of rects) {
            this.addDebugEvent(rect, false);
        }

        super.pushDirtyRects(rects);
    }

    protected override pushDirtyRect(rect: Rect) {
        this.addDebugEvent(rect, false);

        super.pushDirtyRect(rect);
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

    override paintToInternal(): boolean {
        const wasDirty = super.paintToInternal();

        if (wasDirty) {
            this._paintCounter++;
        }

        if (this._overlayEnabled) {
            // update PPS text
            const now = Date.now();
            const elapsed = now - this._lastPPSMeasurement;
            if (elapsed > 1000) {
                const pps = this._paintCounter * 1000 / elapsed;
                this._lastPPSMeasurement = now;
                this._ppsText = `PPS: ${pps.toFixed(4)} (${this._paintCounter} since last)`;
                this._overlayDirty = true;
                this._paintCounter = 0;
            }

            // paint overlay
            if (wasDirty || this._overlayDirty) {
                this.updateOutputCanvas();
                return true;
            } else {
                return false;
            }
        } else {
            if (wasDirty) {
                this.updateOutputCanvas();
            }

            return wasDirty;
        }
    }
}
