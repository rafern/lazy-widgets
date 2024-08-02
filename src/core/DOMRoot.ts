import { TextPasteEvent } from '../events/TextPasteEvent.js';
import { Root, RootProperties } from './Root.js';
import { Msg } from './Strings.js';
import type { Widget } from '../widgets/Widget.js';

/**
 * A function that controls the size of the DOM element of a UI root.
 */
export type DOMSizeController = (domRoot: DOMRoot, effectiveScale: [xScale: number, yScale: number], dimensions: [width: number, height: number], preferredSize: [width: number, height: number]) => [width: number, height: number];

/**
 * Optional DOMRoot constructor properties.
 *
 * @category Core
 */
export interface DOMRootProperties extends RootProperties {
    /**
     * Should contentEditable be set to true? Needed for paste events, but
     * creates issues on mobile; virtual keyboard is opened whenever the canvas
     * is clicked. Disabled by default
     */
    enablePasteEvents?: boolean;
    /** See {@link DOMRoot#domSizeController}. */
    domSizeController?: DOMSizeController;
}

/**
 * Like Root, but for easy use in an HTML page.
 *
 * Instead of calling each individual update method, simply call
 * {@link DOMRoot#update} on every animation frame. {@link Driver | Drivers}
 * still need to be manually registered.
 *
 * @category Core
 */
export class DOMRoot extends Root {
    /** This root's canvas element. Add this to the HTML body */
    readonly domElem: HTMLCanvasElement;
    /** This root's canvas element's context. Used for painting */
    private domCanvasContext: CanvasRenderingContext2D;
    /**
     * A function that controls the size of the DOM element of this UI root.
     * Optional.
     */
    private domSizeController?: DOMSizeController;

    constructor(child: Widget, properties?: Readonly<DOMRootProperties>) {
        super(child, properties);

        // Make DOM element, which is a canvas, and get a 2D context for it
        this.domElem = document.createElement('canvas');
        this.updateDOMDims();

        const context = this.domElem.getContext('2d', { alpha: true });
        if(context === null) {
            throw new Error(Msg.REUSABLE_CANVAS_CONTEXT);
        }

        this.domCanvasContext = context;

        // Setup pointer style handler
        if(this.pointerStyleHandler === null) {
            this.pointerStyleHandler = (newPointerStyle: string): void => {
                this.domElem.style.cursor = newPointerStyle;
            };
        }

        if (properties?.enablePasteEvents) {
            // Listen to paste events
            this.domElem.addEventListener('paste', event => {
                event.preventDefault();
                if(event.clipboardData !== null) {
                    this.dispatchEvent(new TextPasteEvent(event.clipboardData.getData('text')));
                }
            });
            this.domElem.contentEditable = 'true';

            // Remove styling added by contenteditable
            this.domElem.style.outline = '0px solid transparent';
            this.domElem.style.caretColor = 'transparent';
            this.domElem.style.cursor = 'default';
        }

        this.domSizeController = properties?.domSizeController;
    }

    /**
     * Update DOMRoot.
     *
     * If root is disabled, {@link DOMRoot#domElem}'s display style is set to
     * 'none', hiding it.
     *
     * Calls {@link Root#preLayoutUpdate}, {@link Root#resolveLayout},
     * {@link Root#postLayoutUpdate} and {@link Root#paint}.
     */
    update(): void {
        if(this.enabled) {
            this.domElem.style.removeProperty('display');
        } else {
            return;
        }

        this.preLayoutUpdate();
        if(this.resolveLayout()) {
            this.updateDOMDims();
            this.rescaleDOMElement();
        }
        this.postLayoutUpdate();
        if(this.paint()) {
            this.domCanvasContext.globalCompositeOperation = 'copy';

            const [w, h] = this.viewport.usableCanvasDimensions;
            let sx = 0, sy = 0;

            if (this.preventAtlasBleeding) {
                sx++;
                sy++;
            }

            this.domCanvasContext.drawImage(
                this.canvas, sx, sy, w, h, 0, 0, w, h
            );
        }
    }

    /** Update the width and height of {@link DOMRoot#domElem} */
    private updateDOMDims(): void {
        const [scaleX, scaleY] = this.effectiveScale;
        const [dimsX, dimsY] = this.dimensions;
        // XXX canvas width/height is auto-truncated, so manually round it
        // so that values such as 99.9997 don't get turned into 99 instead
        // of 100
        this.domElem.width = Math.round(dimsX * scaleX);
        this.domElem.height = Math.round(dimsY * scaleY);
    }

    /**
     * Re-scale the DOM element of this UI root. You only need to manually call
     * this if you use a {@link DOMRoot#domSizeController} and an external
     * factor would affect the result of your custom size.
     *
     * Counters Root viewport scaling with an opposite CSS scale (via width and
     * height, not CSS transforms), and applies size given by domSizeController,
     * if any is supplied.
     */
    rescaleDOMElement(): void {
        const [scaleX, scaleY] = this.effectiveScale;
        let wantedWidth = this.domElem.width / scaleX;
        let wantedHeight = this.domElem.height / scaleY;

        if (this.domSizeController) {
            [wantedWidth, wantedHeight] = this.domSizeController(this, [scaleX, scaleY], this.dimensions, [wantedWidth, wantedHeight]);
        }

        this.domElem.style.width = (wantedWidth).toString() + 'px';
        this.domElem.style.height = (wantedHeight).toString() + 'px';
    }

    override get enabled() {
        return super.enabled;
    }

    override set enabled(enabled: boolean) {
        if (!enabled && this._enabled !== enabled) {
            this.domElem.style.display = 'none';
        }

        super.enabled = enabled;
    }

    override destroy(): void {
        super.destroy();

        // remove DOM element
        const parentElem = this.domElem.parentElement;
        if (parentElem) {
            parentElem.removeChild(this.domElem);
        }
    }
}
