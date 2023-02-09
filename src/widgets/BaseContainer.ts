import { Widget, WidgetProperties } from './Widget';
import { SingleParent } from './SingleParent';
import type { Event } from '../events/Event';
import type { Rect } from '../helpers/Rect';
import { resolveContainerDimensions } from '../helpers/resolveContainerDimensions';
import { resolveContainerPosition } from '../helpers/resolveContainerPosition';

/**
 * A {@link SingleParent} which contains a single child and automatically paints
 * the child, adds padding, propagates events (if enabled) and handles layout.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export abstract class BaseContainer<W extends Widget = Widget> extends SingleParent<W> {
    constructor(child: W, propagateEvents: boolean, properties?: Readonly<WidgetProperties>) {
        // Containers clear their own background, have a child and may propagate
        // events
        super(child, propagateEvents, properties);
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'containerPadding'
           || property === 'containerAlignment') {
            this._layoutDirty = true;
        }
    }

    protected override handleEvent(event: Event): Widget | null {
        // Dispatch event to child
        return this.child.dispatchEvent(event);
    }

    protected override handlePreLayoutUpdate(): void {
        // Pre-layout update child
        const child = this.child;
        child.preLayoutUpdate();

        // If child's layout is dirty, set self's layout as dirty
        if(child.layoutDirty) {
            this._layoutDirty = true;
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update child
        this.child.postLayoutUpdate();
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        [this.idealWidth, this.idealHeight] = resolveContainerDimensions(minWidth, maxWidth, minHeight, maxHeight, this.containerPadding, this.containerAlignment, this.child);
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);
        resolveContainerPosition(x, y, this.idealWidth, this.idealHeight, this.containerPadding, this.containerAlignment, this.child);
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint child
        this.child.paint(dirtyRects);
    }
}
