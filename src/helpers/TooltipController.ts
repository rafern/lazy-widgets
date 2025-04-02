import { type Layer } from '../core/Layer.js';
import { LayeredContainer } from '../widgets/LayeredContainer.js';
import { type TooltipContainer } from '../widgets/TooltipContainer.js';
import { type Widget } from '../widgets/Widget.js';

/**
 * Controls the visibility of a {@link TooltipContainer}. Used for implementing
 * tooltips, such as in {@link Tooltip}, or to implement tooltip-like
 * functionality, such as dropdowns or context menus.
 */
export class TooltipController<W extends Widget = Widget, C extends TooltipContainer = TooltipContainer> {
    /** The top-most container in the current UI tree */
    private topLayeredContainer: LayeredContainer | null = null;
    /** The currently created layer for the {@link Tooltip#tooltipWidget} */
    private layer: Layer<C> | null = null;

    constructor(readonly tooltipWrapper: W, readonly tooltipContainer: C) {}

    findTopLayeredContainer(widget: Widget): void {
        // find top-most layered container and use it do add/remove the tooltip
        // widget
        let focus: Widget | null = widget;
        while (focus !== null) {
            if (focus instanceof LayeredContainer) {
                this.topLayeredContainer = focus;
            }

            focus = focus.parent;
        }

        if (this.topLayeredContainer === null) {
            console.warn('Tooltip has no LayeredContainer ascendant. Tooltip will not be shown');
        }
    }

    clearTopLayeredContainer(): void {
        this.removeLayer();
        this.topLayeredContainer = null;
    }

    /**
     * Add a layer for the {@link TooltipController#tooltipContainer}.
     *
     * @returns True if the layer was addedd successfully, or false if there was no top layered container.
     */
    addLayer(relAnchorX: number, relAnchorY: number): boolean {
        if (this.topLayeredContainer === null) {
            return false;
        }

        // add layer with tooltip widget
        this.layer = <Layer<C>>{
            child: this.tooltipContainer,
            canExpand: false
        };
        this.topLayeredContainer.pushLayer(this.layer);

        // get anchor pos and this widget relative to layerered container.
        // update tooltip widget with these positions
        [this.tooltipContainer.anchorX, this.tooltipContainer.anchorY] = this.tooltipWrapper.queryPointFromHere(relAnchorX, relAnchorY, this.topLayeredContainer);
        this.updateTooltipRect();
        return true;
    }

    /**
     * Remove the layer of the {@link TooltipController#tooltipContainer}
     * ({@link TooltipController#layer}).
     */
    removeLayer(): void {
        if (!this.layer) {
            return;
        }

        const layer = this.layer as Layer<C>;
        const container = this.topLayeredContainer as LayeredContainer;
        const layerIndex = container.getLayerIndex(layer);

        if (layerIndex) {
            container.removeLayer(layerIndex);
        } else {
            console.warn('Could not find tooltip layer in LayeredContainer. Maybe it was removed externally?');
        }

        this.layer = null;
    }

    get hasLayer() {
        return this.layer !== null;
    }

    /**
     * Update the {@link TooltipContainer#tooltipRect} of the
     * {@link TooltipController#tooltipContainer}.
     */
    updateTooltipRect() {
        if (this.layer === null) {
            return;
        }

        this.tooltipContainer.tooltipRect = this.tooltipWrapper.queryRectFromHere(this.tooltipWrapper.idealRect, this.topLayeredContainer);
    }
}
