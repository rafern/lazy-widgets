import { PropagationModel, type WidgetEvent } from '../events/WidgetEvent.js';
import { type Rect } from '../helpers/Rect.js';
import { type WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { Parent } from './Parent.js';
import { Widget, type WidgetProperties } from './Widget.js';

/**
 * A {@link Parent} widget, similar to {@link PassthroughWidget}, which can
 * optionally have a single child, or no child at all, and can transfer the
 * child to other WidgetSlots.
 *
 * @category Widget
 */
export class WidgetSlot<W extends Widget = Widget> extends Parent<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'widget-slot',
        inputConfig: [
            {
                mode: 'widget',
                name: 'child',
                optional: true,
            }
        ]
    };

    private _child: W | null = null;

    /**
     * @param child - The optional single child of this widget. Can be changed later via either {@link WidgetSlot#child} or {@link WidgetSlot#transferChild}.
     */
    constructor(child: W | null = null, properties?: Readonly<WidgetProperties>) {
        super(properties);
        this.child = child;
    }

    /** The current child in this slot. May be null if the slot is empty. */
    get child(): W | null {
        return this._child;
    }

    set child(child: W | null) {
        if (this._child === child) {
            return;
        }

        if (child && child.attached) {
            throw new Error('New child is already attached to another widget');
        }

        const isAttached = this.attached;
        if (this._child && isAttached) {
            this._child.detach();
        }
        this._child = child;

        if (child){
            child.inheritedTheme = this.inheritedTheme;
            if (isAttached) {
                child.attach(this.root, this.viewport, this);
            }
        }

        this._layoutDirty = true;
        this.markWholeAsDirty();
    }

    /**
     * Transfer this widget's child to a new WidgetSlot. Note that, if this
     * widget has no child, then the new slot will have its child removed.
     *
     * Does nothing if the new slot is this.
     */
    transferChildTo(newSlot: WidgetSlot<W>) {
        if (newSlot === this) {
            return;
        }

        const child = this._child;
        this.child = null;
        newSlot.child = child;
    }

    /**
     * Swap this widget's child with another WidgetSlot's child. Also works if
     * either (or both) slots have no child.
     *
     * Does nothing if the other slot is this.
     */
    swapChildWith(otherSlot: WidgetSlot<W>) {
        if (otherSlot === this) {
            return;
        }

        const thisChild = this._child;
        const otherChild = otherSlot.child;
        this.child = null;
        otherSlot.child = thisChild;
        this.child = otherChild;
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            return super.handleEvent(event);
        } else if (this._child) {
            return this._child.dispatchEvent(event);
        } else {
            return null;
        }
    }

    protected override handlePreLayoutUpdate(): void {
        if (!this._child) {
            return;
        }

        // Pre-layout update child
        this._child.preLayoutUpdate();

        // If child's layout is dirty, set self's layout as dirty
        if(this._child && this._child.layoutDirty) {
            this._layoutDirty = true;
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update child
        if (this._child) {
            this._child.postLayoutUpdate();
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Resolve child's dimensions and set own resolved dimensions to be
        // equal to the child's
        if (this._child) {
            this._child.resolveDimensions(minWidth, maxWidth, minHeight, maxHeight);
            [this.idealWidth, this.idealHeight] = this._child.idealDimensions;
        } else {
            this.idealWidth = 0;
            this.idealHeight = 0;
        }
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);

        // Resolve child's position to be the same as this widget's position
        if (this._child) {
            this._child.resolvePosition(x, y);
        }
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint child
        if (this._child) {
            this._child.paint(dirtyRects);
        }
    }

    override [Symbol.iterator](): Iterator<W> {
        const child = this._child;
        let first = !!child;

        return <Iterator<W>>{
            next() {
                if (first) {
                    first = false;
                    return { value: child, done: false };
                } else {
                    return { value: undefined, done: true };
                }
            }
        }
    }

    override get childCount(): 1 | 0 {
        return this._child ? 1 : 0;
    }
}
