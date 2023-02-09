import { Layer } from '../core/Layer';
import type { Root } from '../core/Root';
import type { Viewport } from '../core/Viewport';
import type { TricklingEvent } from '../events/TricklingEvent';
import { Leave } from '../events/Leave';
import { PointerMove } from '../events/PointerMove';
import { LayeredContainer } from './LayeredContainer';
import { PassthroughWidget } from './PassthroughWidget';
import { TooltipContainer } from './TooltipContainer';
import type { Widget, WidgetProperties } from './Widget';

const SENSITIVITY_RADIUS = 8;
const HOVER_TIME = 1000;

/**
 * Wraps a widget and provides a tooltip. Automatically manages a given
 * {@link TooltipContainer}, which will be used as the actual visual tooltip.
 *
 * Whenever this widget is hovered for a small amount of time without moving
 * the pointer too much, a new layer will be created with the passed
 * {@link TooltipContainer}, in the top-most {@link LayeredContainer}.
 * Unhovering this wrapper will remove the layer.
 *
 * Has a tolerance for small movements, so that shaky pointers can still be used
 * to detect hovering.
 */
export class Tooltip<W extends Widget = Widget, T extends TooltipContainer = TooltipContainer> extends PassthroughWidget<W> {
    /** The top-most container in the current UI tree. Internal use only */
    private _topLayerContainer: LayeredContainer | null = null;
    /** The currently created layer for the {@link Tooltip#tooltipWidget} */
    private _layer: Layer<T> | null = null;
    /**
     * The timestamp for when the hovering started. 0 if not hovering. For
     * internal use only.
     */
    private _hoverStart = 0;
    /**
     * The X pointer position for when the hovering started. For internal use
     * only.
     */
    private _hoverStartX = 0;
    /**
     * The Y pointer position for when the hovering started. For internal use
     * only.
     */
    private _hoverStartY = 0;
    /** The actual tooltip that will be shown when this wrapper is hovered. */
    readonly tooltipWidget: T;

    constructor(child: W, tooltipWidget: T, properties?: Readonly<WidgetProperties>) {
        super(child, properties);

        this.tooltipWidget = tooltipWidget;
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        super.attach(root, viewport, parent);

        // find top-most layered container and use it do add/remove the tooltip
        // widget
        let focus = parent;
        while (focus !== null) {
            if (focus instanceof LayeredContainer) {
                this._topLayerContainer = focus;
            }

            focus = focus.parent;
        }

        if (this._topLayerContainer === null) {
            console.warn('Tooltip has no LayeredContainer ascendant. Tooltip will not be shown');
        }
    }

    override detach(): void {
        if (this._layer) {
            this.removeLayer();
        }

        this._topLayerContainer = null;
        super.detach();
    }

    protected override handlePreLayoutUpdate(): void {
        super.handlePreLayoutUpdate();

        // show tooltip if hovered for long enough
        if (this._layer === null && this._hoverStart !== 0 && (Date.now() - this._hoverStart) >= HOVER_TIME) {
            this.addLayer();
        }
    }

    protected override handleEvent(event: TricklingEvent): Widget | null {
        // check if this event should count as a hover/unhover
        if (event instanceof PointerMove) {
            if (this._hoverStart === 0) {
                this._hoverStart = Date.now();
                this._hoverStartX = event.x;
                this._hoverStartY = event.y;
            } else if (this._layer === null) {
                const xDiff = Math.abs(this._hoverStartX - event.x);
                const yDiff = Math.abs(this._hoverStartY - event.y);

                if (xDiff > SENSITIVITY_RADIUS || yDiff > SENSITIVITY_RADIUS) {
                    this._hoverStart = Date.now();
                    this._hoverStartX = event.x;
                    this._hoverStartY = event.y;
                }
            }
        } else if (event instanceof Leave) {
            this._hoverStart = 0;

            if (this._layer) {
                this.removeLayer();
            }
        }

        // dispatch event to child
        return this.child.dispatchEvent(event);
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);
        this.updateTooltipRect();
    }

    override finalizeBounds(): void {
        super.finalizeBounds();
        this.updateTooltipRect();
    }

    /**
     * Add a layer to the {@link Tooltip#tooltipWidget}. For internal use only.
     */
    private addLayer(): void {
        if (this._topLayerContainer === null) {
            return;
        }

        // add layer with tooltip widget
        this._layer = <Layer<T>>{
            child: this.tooltipWidget,
            canExpand: false
        };
        this._topLayerContainer.pushLayer(this._layer);

        // get cursor pos and this widget relative to layerered container.
        // update tooltip widget with these positions
        [this.tooltipWidget.cursorX, this.tooltipWidget.cursorY] = this.queryPointFromHere(this._hoverStartX, this._hoverStartY, this._topLayerContainer);
        this.updateTooltipRect();
    }

    /**
     * Update the {@link TooltipContainer#tooltipRect} of the
     * {@link Tooltip#tooltipWidget}. For internal use only.
     */
    private updateTooltipRect() {
        if (this._layer === null) {
            return;
        }

        this.tooltipWidget.tooltipRect = this.queryRectFromHere(this.idealRect, this._topLayerContainer);
    }

    /**
     * Remove the layer of the {@link Tooltip#tooltipWidget}
     * ({@link Tooltip#_layer}). For internal use only.
     */
    private removeLayer(): void {
        const layer = this._layer as Layer<T>;
        const container = this._topLayerContainer as LayeredContainer;
        const layerIndex = container.getLayerIndex(layer);

        if (layerIndex) {
            container.removeLayer(layerIndex);
        } else {
            console.warn('Could not find tooltip layer in LayeredContainer. Maybe it was removed externally?');
        }

        this._layer = null;
    }
}
