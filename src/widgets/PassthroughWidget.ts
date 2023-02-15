import { Widget, WidgetProperties } from './Widget';
import { SingleParent } from './SingleParent';
import type { Rect } from '../helpers/Rect';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent';

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
    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        // Passthrough widgets dont need a clear background, have a child and
        // propagate events
        super(child, true, properties);
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            return super.handleEvent(event);
        } else {
            return this.child.dispatchEvent(event);
        }
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

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint child
        this.child.paint(dirtyRects);
    }
}
