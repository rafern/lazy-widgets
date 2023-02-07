import { TabSelect } from '../events/TabSelect';
import { TextPasteEvent } from '../events/TextPasteEvent';
import type { TabKeyHelper } from '../helpers/TabKeyHelper';
import { getTabKeyHelper } from '../helpers/TabKeyHelper';
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
    private tabKeyHelper: TabKeyHelper;

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

        // Get tab helper. This will be used for checking if tab is pressed in
        // the "focus" event handler
        this.tabKeyHelper = getTabKeyHelper();
        this.tabKeyHelper.ref(this);

        // Make DOM element, which is a canvas, and get a 2D context for it
        this.domElem = document.createElement('canvas');
        this.domElem.tabIndex = 0;
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

        // Listen to paste events
        this.domElem.addEventListener('paste', event => {
            event.preventDefault();
            if(event.clipboardData !== null) {
                this.dispatchEvent(new TextPasteEvent(event.clipboardData.getData('text')));
            }
        });
        this.domElem.contentEditable = 'true';

        // Listen to focus events
        this.domElem.addEventListener('focusin', async (event) => {
            // HACK only auto-send tab event if the focus event was caused by
            // pressing tab. there is no api for this, but we can monkey-patch
            // it:
            // 1. check relatedTarget. if null, then focus was caused by calling
            //    the `.focus()` method
            // 2. check if tab key is down. focus direction can be determined by
            //    checking if shift key is down
            // there is also no api for checking if a key is pressed, so we have
            // to use a global key listener in the page.
            // the keyboard state is invalid when focusing the window, so an
            // extra check is also needed for that.
            if ((event.relatedTarget && this.tabKeyHelper.pressed) || await this.tabKeyHelper.isTabInitiatedFocus()) {
                // BUG if the focus is caused by the window itself getting
                // focus, then it's impossible to tell the direction of the tab
                // since no keydown event is ever dispatched. this means that
                // tabbing into a window/iframe without pressing shift will have
                // the correct behaviour, but SHIFT-tabbing into a window will
                // not:
                // 1. the last root will be selected (correct)
                // 2. shift will be detected as not pressed (incorrect)
                // 3. the first widget will be tabselected instead of the last
                //    (incorrect)
                // a way to work around this bug would be to detect if there are
                // any elements with tabindex BEFORE the domElem, only if this
                // focus is caused by focusing the window, but this won't work
                // if the DOMRoot is the only element in the page with a
                // tabindex, and it's very expensive to query the entire DOM
                // every time the user tabs into a window/iframe
                this.dispatchEvent(new TabSelect(null, this.tabKeyHelper.directionReversed));
            }
        });

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
        } else {
            this.domElem.style.removeProperty('display');
        }

        this.preLayoutUpdate();
        if(this.resolveLayout()) {
            this.updateDOMDims();
            this.autoScale();
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
     * Counter Root viewport scaling with an opposite CSS scale (via width and
     * height, not CSS transforms).
     */
    private autoScale(): void {
        const [scaleX, scaleY] = this.effectiveScale;
        this.domElem.style.width = (this.domElem.width / scaleX).toString() + 'px';
        this.domElem.style.height = (this.domElem.height / scaleY).toString() + 'px';
    }

    override destroy(): void {
        super.destroy();

        // remove DOM element
        const parentElem = this.domElem.parentElement;
        if (parentElem) {
            parentElem.removeChild(this.domElem);
        }

        // unreference tab helper
        this.tabKeyHelper.unref(this);
    }
}
