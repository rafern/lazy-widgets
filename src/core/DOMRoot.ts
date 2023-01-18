import { TextPasteEvent } from '../events/TextPasteEvent';
import type { Widget } from '../widgets/Widget';
import { Root, RootProperties } from './Root';
import { Msg } from './Strings';

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
     * Create a new DOMRoot.
     *
     * Sets {@link Root#child} and {@link Root#child}'s
     * {@link Widget#inheritedTheme | inherited theme}. Also sets up a
     * {@link Root#pointerStyleHandler} which simply sets the CSS cursor style
     * of {@link DOMRoot#domElem}, unless a handler is already supplied in the
     * optional properties argument. Creates {@link DOMRoot#domElem} and
     * {@link DOMRoot#domCanvasContext}.
     */
    constructor(child: Widget, properties?: Readonly<RootProperties>) {
        super(child, properties);

        // Make DOM element, which is a canvas, and get a 2D context for it
        this.domElem = document.createElement('canvas');
        this.domElem.tabIndex = 1;
        this.updateDOMDims();

        const context = this.domElem.getContext('2d', { alpha: true });
        if(context === null)
            throw new Error(Msg.REUSABLE_CANVAS_CONTEXT);

        this.domCanvasContext = context;

        // Setup pointer style handler
        if(this.pointerStyleHandler === null) {
            this.pointerStyleHandler = (newPointerStyle: string): void => {
                this.domElem.style.cursor = newPointerStyle;
            };
        }

        // Listen to paste events
        this.domElem.addEventListener('paste', event => {
            event.preventDefault();
            if(event.clipboardData !== null)
                this.dispatchEvent(new TextPasteEvent(event.clipboardData.getData('text')));
        });
        this.domElem.contentEditable = 'true';

        // Remove styling added by contenteditable
        this.domElem.style.outline = '0px solid transparent';
        this.domElem.style.caretColor = 'transparent';
        this.domElem.style.cursor = 'default';
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
        if(!this.enabled) {
            this.domElem.style.display = 'none';
            return;
        }
        else
            this.domElem.style.removeProperty('display');

        this.preLayoutUpdate();
        if(this.resolveLayout()) {
            this.updateDOMDims();
            this.autoScale();
        }
        this.postLayoutUpdate();
        if(this.paint()) {
            this.domCanvasContext.globalCompositeOperation = 'copy';
            this.domCanvasContext.drawImage(this.canvas, 0, 0);
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
     * Counter Root viewport scaling with an opposite CSS scale (via width and
     * height, not CSS transforms).
     */
    private autoScale(): void {
        const [scaleX, scaleY] = this.effectiveScale;
        this.domElem.style.width = (this.domElem.width / scaleX).toString() + 'px';
        this.domElem.style.height = (this.domElem.height / scaleY).toString() + 'px';
    }
}