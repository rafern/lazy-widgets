import { CanvasViewport } from '../core/CanvasViewport.js';
import { Widget, type WidgetProperties } from './Widget.js';
import { Rect } from '../helpers/Rect.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { TricklingEvent } from '../events/TricklingEvent.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import type { Viewport } from '../core/Viewport.js';
import type { Root } from '../core/Root.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { viewportRelativePointToAbsolute } from '../helpers/viewportRelativePointToAbsolute.js';
import { viewportRelativeRectToAbsolute } from '../helpers/viewportRelativeRectToAbsolute.js';
import { clipRelativeRectToAbsoluteViewport } from '../helpers/clipRelativeRectToAbsoluteViewport.js';
import { BaseContainer } from './BaseContainer.js';

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
        this.internalViewport.rect = [this.x, this.y, this.width, this.height];
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        this.internalViewport.constraints = [minWidth, maxWidth, minHeight, maxHeight];
        this.internalViewport.resolveLayout();
        [this.idealWidth, this.idealHeight] = this.child.idealDimensions;
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        // FIXME we shouldn't have to do this, this is horrible...
        // HACK Parent#attach attaches child widgets with this._viewport, but
        //      we want to use this.internalViewport
        Widget.prototype.attach.call(this, root, viewport, parent);
        this.internalViewport.parent = viewport;
        this.child.attach(root, this.internalViewport, this);
    }

    override detach(): void {
        // unset parent viewport of internal viewport
        this.internalViewport.parent = null;
        super.detach();
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        this.internalViewport.paint(dirtyRects);
    }

    override propagateDirtyRect(rect: Rect): void {
        const clippedRect = clipRelativeRectToAbsoluteViewport(this.internalViewport, this.rect, rect);
        if (!clippedRect) {
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
