import { Widget, WidgetProperties } from './Widget';
import { Alignment } from '../theme/Alignment';
import { SingleParent } from './SingleParent';
import type { Event } from '../events/Event';
import type { Rect } from '../helpers/Rect';

/**
 * A {@link SingleParent} which contains a single child and automatically paints
 * the child, adds padding, propagates events (if enabled) and handles layout.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export abstract class BaseContainer<W extends Widget = Widget> extends SingleParent<W> {
    /** Create a new BaseContainer. */
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
        const child = this.child;
        child.postLayoutUpdate();

        // If child is dirty, set self as dirty
        if(child.dirty) {
            this._dirty = true;
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Get padding
        const padding = this.containerPadding;
        const hPadding = padding.left + padding.right;
        const vPadding = padding.top + padding.bottom;
        let childMaxWidth = maxWidth - hPadding;
        let childMaxHeight = maxHeight - vPadding;

        // If there isn't enough space for padding, resolve child's layout with
        // a tight fit of 0 for axis with lack of space
        if(childMaxWidth < 0) {
            childMaxWidth = 0;
        }
        if(childMaxHeight < 0) {
            childMaxHeight = 0;
        }

        // Provide minimum constraints if using stretch alignment, correcting
        // for padding. If maximum constraints are available (not infinite), use
        // those instead
        const alignment = this.containerAlignment;
        let childMinWidth = 0;
        if(alignment.horizontal === Alignment.Stretch) {
            if(childMaxWidth !== Infinity) {
                childMinWidth = childMaxWidth;
            } else {
                childMinWidth = Math.max(minWidth - hPadding, 0);
            }
        }

        let childMinHeight = 0;
        if(alignment.vertical === Alignment.Stretch) {
            if(childMaxHeight !== Infinity) {
                childMinHeight = childMaxHeight;
            } else {
                childMinHeight = Math.max(minHeight - vPadding, 0);
            }
        }

        // Resolve child's dimensions
        const [oldChildWidth, oldChildHeight] = this.child.idealDimensions;
        this.child.resolveDimensions(childMinWidth, childMaxWidth, childMinHeight, childMaxHeight);
        const [childWidth, childHeight] = this.child.idealDimensions;

        // Resolve own dimensions
        const [oldWidth, oldHeight] = [this.idealWidth, this.idealHeight];
        this.idealWidth = Math.max(minWidth, childWidth + hPadding);
        this.idealHeight = Math.max(minHeight, childHeight + vPadding);

        // Mark background as dirty if own size or child's size changed
        if(this.idealWidth !== oldWidth || this.idealHeight !== oldHeight ||
           childWidth !== oldChildWidth || childHeight !== oldChildHeight) {
            // TODO set dirty rect to entire widget
        }
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);

        // Get padding and alignment
        const padding = this.containerPadding;
        const alignment = this.containerAlignment;

        // Calculate used space
        const [childWidth, childHeight] = this.child.idealDimensions;
        const usedWidth = childWidth + padding.left + padding.right;
        const usedHeight = childHeight + padding.top + padding.bottom;

        // Horizontal offset
        let childX = x + padding.left;
        if(alignment.horizontal !== Alignment.Stretch) {
            // Get free space for this axis
            const freeSpace = this.idealWidth - usedWidth;

            // Ignore if free space is negative or zero, as in, the child didn't
            // even get the space they requested or just enough space. If there
            // is free space, distribute free space according to chosen
            // alignment ratio
            if(freeSpace > 0) {
                childX += freeSpace * alignment.horizontal;
            }
        }

        // Vertical offset
        let childY = y + padding.top;
        if(alignment.vertical !== Alignment.Stretch) {
            // Same logic as above, but for vertical axis
            const freeSpace = this.idealHeight - usedHeight;

            if(freeSpace > 0) {
                childY += freeSpace * alignment.vertical;
            }
        }

        // Resolve child's position
        const [oldChildX, oldChildY] = this.child.idealPosition;
        this.child.resolvePosition(childX, childY);

        // If child's position changed, mark background as dirty
        if(oldChildX !== childX || oldChildY !== childY) {
            // TODO set dirty rect to entire widget
        }
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint child
        this.child.paint(dirtyRects);
    }
}
