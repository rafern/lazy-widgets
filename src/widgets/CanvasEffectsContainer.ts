import { ClippedViewportRect } from '../core/BaseViewport.js';
import { damageField } from '../decorators/FlagFields.js';
import { type Rect } from '../helpers/Rect.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import { type WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { CanvasContainer } from './CanvasContainer.js';
import { Widget, type WidgetProperties } from './Widget.js';

export interface CanvasEffectsContainerProperties extends WidgetProperties {
    /** Sets {@link CanvasEffectsContainer#opacity}. */
    opacity?: number;
    /** Sets {@link CanvasEffectsContainer#compositeOperation}. */
    compositeOperation?: GlobalCompositeOperation;
    /** Sets {@link CanvasEffectsContainer#filter}. */
    filter?: string;
}

// TODO filter-less shadows. this should also let us use damage regions without
//      destroying performance (see shadow(Offset[XY]|Color|Blur).
//      for this to be worth it we need to know exactly the pixel radius of a
//      shadowBlur unit. apparently 1 shadowBlur unit = 0.5 gaussian blur
//      standard deviations. how much is a standard deviation as radius pixels?
//      who knows...

/**
 * A {@link CanvasContainer} which applies visual effects to the child widget.
 */
export class CanvasEffectsContainer<W extends Widget = Widget> extends CanvasContainer<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'canvas-effects-container',
        inputConfig: SingleParentXMLInputConfig
    };

    /**
     * The opacity of the container, as a factor from 0 to 1. Defaults to 1
     * (opaque).
     *
     * Although you can apply opacity via filters, it's much cheaper to use this
     * property. See the {@link CanvasEffectsContainer#filter} documentation for
     * details.
     */
    @damageField
    opacity: number;
    /**
     * The compositing or blending mode to use when painting the canvas:
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation}
     */
    @damageField
    compositeOperation: GlobalCompositeOperation;
    /**
     * Applies a CSS filter to the container. This can be anything accepted by
     * the filter property:
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter}
     *
     * Note that applying CSS filters is expensive. This is because filters
     * could be anything, meaning we have to assume the worst-case scenario;
     * non-local filters. Since some filters like drop-shadows and blur affect
     * their surrounding pixels (non-local), we have to apply
     * otherwise-unnecessary clipping, as well as assume that any damage to the
     * child widget could propagate to the entire container.
     *
     * Note also that, for now, widgets can only paint to their bounds. This
     * means that if you have an effect that goes outside of the child widget's
     * bounds, you need to use container padding, otherwise the effect will be
     * clipped.
     *
     * For this reason, you should only use this property if there is no
     * alternative. For example, don't use this property for opacity; instead,
     * use {@link CanvasEffectsContainer#opacity}.
     */
    @damageField
    filter: string;

    constructor(child: W, properties?: Readonly<CanvasEffectsContainerProperties>) {
        super(child, properties);

        this.opacity = properties?.opacity ?? 1;
        this.compositeOperation = properties?.compositeOperation ?? 'source-over';
        this.filter = properties?.filter ?? 'none';
    }

    protected override paintInternalCanvas(clippedViewportRect: ClippedViewportRect): void {
        const ctx = this.viewport.context;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.globalCompositeOperation = this.compositeOperation;

        if (this.filter !== 'none') {
            ctx.filter = this.filter;
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.clip();
        }

        super.paintInternalCanvas(clippedViewportRect);

        ctx.restore();
    }

    protected override handleCanvasDamage(rect: Rect): boolean {
        if (this.filter !== 'none') {
            // XXX assume damage to the whole container if there is a filter, as
            //     the filter could be non-local (such as shadows and blur)
            rect[0] = this.x;
            rect[1] = this.y;
            rect[2] = this.width;
            rect[3] = this.height;
        }

        return true;
    }
}
