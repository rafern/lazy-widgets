import { Widget, WidgetProperties } from './Widget';
import { SingleParent } from './SingleParent';
import type { Event } from '../events/Event';

/**
 * A {@link SingleParent} which contains a single child and does nothing,
 * passing all events through to its child. Useful for widgets that are only
 * used for logic, like {@link ThemeScope}.
 *
 * Can be constrained to a specific type of children.
 *
 * Since this does nothing on its own, it should not be used on its own.
 * Instead, extend this class if you are looking for a way to do wrapper widgets
 * that provide extra logic.
 *
 * @category Widget
 */
export class PassthroughWidget<W extends Widget = Widget> extends SingleParent<W> {
    /** Create a new PassthroughWidget. */
    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        // Passthrough widgets dont need a clear background, have a child and
        // propagate events
        super(child, false, true, properties);
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
        if(child.layoutDirty)
            this._layoutDirty = true;
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update child
        const child = this.child;
        child.postLayoutUpdate();

        // If child is dirty, set self as dirty
        if(child.dirty)
            this._dirty = true;
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Resolve child's dimensions and set own resolved dimensions to be
        // equal to the child's
        const child = this.child;
        child.resolveDimensions(minWidth, maxWidth, minHeight, maxHeight);
        [this.idealWidth, this.idealHeight] = child.idealDimensions;
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);

        // Resolve child's position to be the same as this widget's position
        this.child.resolvePosition(x, y);
    }

    protected override handlePainting(forced: boolean): void {
        // Paint child
        this.child.paint(forced);
    }
}