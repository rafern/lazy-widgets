import { Layer } from '../core/Layer';
import type { Root } from '../core/Root';
import type { Viewport } from '../core/Viewport';
import type { Event } from '../events/Event';
import { Leave } from '../events/Leave';
import { PointerMove } from '../events/PointerMove';
import { LayeredContainer } from './LayeredContainer';
import { PassthroughWidget } from './PassthroughWidget';
import { TooltipBox } from './TooltipBox';
import type { Widget, WidgetProperties } from './Widget';

const SENSITIVITY_RADIUS = 8;
const HOVER_TIME = 1000;

export class Tooltip<W extends Widget = Widget, T extends TooltipBox = TooltipBox> extends PassthroughWidget<W> {
    private _topLayerContainer: LayeredContainer | null = null;
    private _layer: Layer<T> | null = null;
    private _hoverStart = 0;
    private _hoverStartX = 0;
    private _hoverStartY = 0;

    constructor(child: W, readonly tooltipWidget: T, properties?: Readonly<WidgetProperties>) {
        super(child, properties);
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

    protected override handleEvent(event: Event): Widget | null {
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

    private addLayer(): void {
        if (this._topLayerContainer === null) {
            return;
        }

        this._layer = <Layer<T>>{
            child: this.tooltipWidget,
            canExpand: false
        };
        this._topLayerContainer.pushLayer(this._layer);
        // TODO get cursor pos relative to layerered container
        this.tooltipWidget.cursorX = this._hoverStartX;
        this.tooltipWidget.cursorY = this._hoverStartY;
    }

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
