import { CanvasViewport } from '../core/CanvasViewport.js';
import { Widget, type WidgetProperties } from './Widget.js';
import { Rect } from '../helpers/Rect.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { TricklingEvent } from '../events/TricklingEvent.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { viewportRelativePointToAbsolute } from '../helpers/viewportRelativePointToAbsolute.js';
import { viewportRelativeRectToAbsolute } from '../helpers/viewportRelativeRectToAbsolute.js';
import { clipRelativeRectToAbsoluteViewport } from '../helpers/clipRelativeRectToAbsoluteViewport.js';
import { BaseContainer } from './BaseContainer.js';
import { resolveContainerChildConstraints } from '../helpers/resolveContainerChildConstraints.js';
import { ClippedViewportRect } from '../core/BaseViewport.js';

/**
 * Similar to {@link Container}, but the child is painted to a
 * {@link CanvasViewport}. There is no reason to use this directly, but you can
 * if you have a niche reason for it. The intended use is to do effects on the
 * child by modifying how the canvas is painted in a base class.
 */
export class CanvasContainer<W extends Widget = Widget> extends BaseContainer<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'canvas-container',
        inputConfig: SingleParentXMLInputConfig
    };

    /** Internal viewport for child widget. */
    protected readonly internalViewport: CanvasViewport;

    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, properties);

        this.internalViewport = new CanvasViewport(child);
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation === PropagationModel.Trickling) {
            return this.internalViewport.dispatchTricklingEvent(event as TricklingEvent);
        } else {
            // XXX this is slightly inneficient, because all BaseContainer does
            //     is check if it's a trickling event, otherwise, it calls
            //     super.handleEvent. we know it isn't though, but the
            //     alternative is to call the grandparent class' handleEvent,
            //     which is horrible design
            return super.handleEvent(event);
        }
    }

    protected override handlePreLayoutUpdate(): void {
        super.handlePreLayoutUpdate();

        // Update viewport resolution if needed
        (this.internalViewport as CanvasViewport).resolution = this.root.resolution;
    }

    override finalizeBounds(): void {
        super.finalizeBounds();

        // Update viewport rect
        const padding = this.containerPadding;
        this.internalViewport.rect = [
            this.x + padding.left,
            this.y + padding.top,
            Math.max(0, this.width - padding.left - padding.right),
            Math.max(0, this.height - padding.top - padding.bottom),
        ];
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        const padding = this.containerPadding;
        const hPadding = padding.left + padding.right;
        const vPadding = padding.top + padding.bottom;
        this.internalViewport.constraints = resolveContainerChildConstraints(minWidth, maxWidth, minHeight, maxHeight, hPadding, vPadding, this.containerAlignment);
        this.internalViewport.resolveLayout();
        [this.idealWidth, this.idealHeight] = this.child.idealDimensions;
        this.idealWidth += hPadding;
        this.idealHeight += vPadding;
    }

    override resolvePosition(x: number, y: number): void {
        // FIXME we shouldn't have to do this, this is horrible...
        Widget.prototype.resolvePosition.call(this, x, y);
        this.child.resolvePosition(0, 0);
    }

    protected override handleAttachment(): void {
        // XXX don't call super.handleAttachment, otherwise the child is
        //     attached to the parent viewport instead of the internal viewport
        this.internalViewport.parent = this._viewport!;
        this.child.attach(this._root!, this.internalViewport, this);
    }

    protected override handleDetachment(): void {
        // unset parent viewport of internal viewport
        this.internalViewport.parent = null;
        super.handleDetachment();
    }

    /**
     * Paint the internal canvas to the parent viewport. Override this method if
     * you want to apply effects to the child widget.
     */
    protected handleInternalCanvasPainting(clippedViewportRect: ClippedViewportRect) {
        this.internalViewport.paintToParentViewport(clippedViewportRect, false);
    }

    protected override handlePainting(_dirtyRects: Array<Rect>): void {
        const clippedViewportRect = this.internalViewport.getClippedViewportRect();
        this.internalViewport.paintToInternal();
        this.handleInternalCanvasPainting(clippedViewportRect);
    }

    /**
     * Transform or discard a damage region from the child widget in the canvas.
     * Override this method if you have non-local effects, such as shadows.
     *
     * The damage region is a mutable reference; you are expected to transform
     * it if necessary.
     *
     * @returns `true` if the damage region should be propagated, or `false` otherwise
     */
    protected handleCanvasDamage(_rect: Rect) {
        return true;
    }

    override propagateDirtyRect(rect: Rect): void {
        // canvas viewports are painted independently, so we need to mark
        // regions in them as dirty
        this.internalViewport.pushDirtyRect([...rect]);

        const clippedRect = clipRelativeRectToAbsoluteViewport(this.internalViewport, this.rect, rect);
        if (!clippedRect || !this.handleCanvasDamage(clippedRect)) {
            return;
        }

        super.propagateDirtyRect(clippedRect);
    }

    override queryRect(rect: Rect, relativeTo: Widget | null = null): Rect {
        return super.queryRect(viewportRelativeRectToAbsolute(this.internalViewport, rect), relativeTo);
    }

    override queryPoint(x: number, y: number, relativeTo: Widget | null = null): [x: number, y: number] {
        return super.queryPoint(...viewportRelativePointToAbsolute(this.internalViewport, x, y), relativeTo);
    }
}
