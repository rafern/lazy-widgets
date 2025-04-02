import { type Layer } from '../core/Layer.js';
import { LayeredContainer } from '../widgets/LayeredContainer.js';
import { type Widget } from '../widgets/Widget.js';

/**
 * Controls the visibility of a tooltip container (such as
 * {@link TooltipContainer}). Used for implementing tooltips, such as in
 * {@link Tooltip}, or to implement tooltip-like functionality, such as
 * dropdowns or context menus.
 */
export abstract class BaseTooltipController<W extends Widget, C extends Widget, O = void> {
    /** The top-most container in the current UI tree */
    protected topLayeredContainer: LayeredContainer | null = null;
    /** The currently created layer for the {@link Tooltip#tooltipWidget} */
    private layer: Layer<C> | null = null;

    constructor(readonly tooltipWrapper: W, readonly tooltipContainer: C) {}

    /**
     * Find the top-most layered container that is an ascendant of the
     * {@link BaseTooltipController#tooltipWrapper}. You must call this when the
     * wrapper widget is attached to a parent.
     *
     * Removes the current layer if there is any, and if the top-most layered
     * container changed.
     */
    findTopLayeredContainer(): void {
        // find top-most layered container and use it do add/remove the tooltip
        // widget
        let newTop: LayeredContainer | null = null;
        let focus: Widget | null = this.tooltipWrapper.parent;
        while (focus !== null) {
            if (focus instanceof LayeredContainer) {
                newTop = focus;
            }

            focus = focus.parent;
        }

        if (newTop === null) {
            // TODO show only once?
            console.warn('Tooltip has no LayeredContainer ascendant. Tooltip will not be shown');
        }

        if (newTop !== this.topLayeredContainer) {
            this.removeLayer();
            this.topLayeredContainer = newTop;
        }
    }

    /**
     * Clear the top-most layered container. You must call this when the wrapper
     * widget is detached from a parent.
     *
     * Removes the current layer if there is any.
     */
    clearTopLayeredContainer(): void {
        this.removeLayer();
        this.topLayeredContainer = null;
    }

    /**
     * Add a layer for the {@link TooltipController#tooltipContainer}. If there
     * is a layer and adding another one would succeed, remove the old one.
     *
     * @returns True if the layer was addedd successfully, or false if there was no top layered container.
     */
    addLayer(_options: O): boolean {
        if (this.topLayeredContainer === null) {
            return false;
        }

        this.removeLayer();

        // add layer with tooltip widget
        this.layer = <Layer<C>>{
            child: this.tooltipContainer,
            canExpand: false
        };
        this.topLayeredContainer.pushLayer(this.layer);
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
        const container = this.topLayeredContainer!;
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

        this.doTooltipRectUpdate();
    }

    /**
     * Implementation for {@link BaseTooltipController#updateTooltipRect}. Must
     * be implemented by base class.
     * {@link BaseTooltipController#topLayeredContainer} is guaranteed to be set
     * when this method is called.
     */
    protected abstract doTooltipRectUpdate(): void;
}
