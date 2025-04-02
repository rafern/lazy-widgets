import { LeaveEvent } from '../events/LeaveEvent.js';
import { PointerMoveEvent } from '../events/PointerMoveEvent.js';
import { PassthroughWidget } from './PassthroughWidget.js';
import { TooltipContainer } from './TooltipContainer.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import type { Root } from '../core/Root.js';
import type { Viewport } from '../core/Viewport.js';
import type { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { TooltipController } from '../helpers/TooltipController.js';

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
 *
 * @category Widget
 */
export class Tooltip<W extends Widget = Widget, T extends TooltipContainer = TooltipContainer> extends PassthroughWidget<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'tooltip',
        inputConfig: [
            {
                mode: 'widget',
                name: 'child'
            },
            {
                mode: 'widget',
                name: 'tooltip-widget'
            }
        ]
    };

    /**
     * The timestamp for when the hovering started. 0 if not hovering. For
     * internal use only.
     */
    private _hoverStart = 0;
    /**
     * The pointer position for when the hovering started. For internal use
     * only.
     */
    private _hoverStartPos: [x: number, y: number] = [0, 0];
    /** The actual tooltip that will be shown when this wrapper is hovered. */
    readonly tooltipWidget: T;
    /** The tooltip controller used for managing tooltip visibility. */
    private readonly controller: TooltipController<this, T>;

    constructor(child: W, tooltipWidget: T, properties?: Readonly<WidgetProperties>) {
        super(child, properties);

        this.tooltipWidget = tooltipWidget;
        this.controller = new TooltipController(this, tooltipWidget);
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        super.attach(root, viewport, parent);
        this.controller.findTopLayeredContainer();
    }

    override detach(): void {
        this.controller.clearTopLayeredContainer();
        super.detach();
    }

    protected override handlePreLayoutUpdate(): void {
        super.handlePreLayoutUpdate();

        // show tooltip if hovered for long enough
        if (this._hoverStart !== 0 && !this.controller.hasLayer && (Date.now() - this._hoverStart) >= HOVER_TIME) {
            this.controller.addLayer(this._hoverStartPos);
        }
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            return super.handleEvent(event);
        }

        // check if this event should count as a hover/unhover
        if (event.isa(PointerMoveEvent)) {
            if (this._hoverStart === 0) {
                this._hoverStart = Date.now();
                this._hoverStartPos[0] = event.x;
                this._hoverStartPos[1] = event.y;
            } else if (!this.controller.hasLayer) {
                const xDiff = Math.abs(this._hoverStartPos[0] - event.x);
                const yDiff = Math.abs(this._hoverStartPos[1] - event.y);

                if (xDiff > SENSITIVITY_RADIUS || yDiff > SENSITIVITY_RADIUS) {
                    this._hoverStart = Date.now();
                    this._hoverStartPos[0] = event.x;
                    this._hoverStartPos[1] = event.y;
                }
            }
        } else if (event.isa(LeaveEvent)) {
            this._hoverStart = 0;
            this.controller.removeLayer();
        }

        // dispatch event to child
        return this.child.dispatchEvent(event);
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);
        this.controller.updateTooltipRect();
    }

    override finalizeBounds(): void {
        super.finalizeBounds();
        this.controller.updateTooltipRect();
    }
}
