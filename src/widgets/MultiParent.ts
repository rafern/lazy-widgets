import { Parent } from './Parent.js';
import type { Widget, WidgetProperties } from '../widgets/Widget.js';
/**
 * A specialised version of the {@link Parent} class for parents with any amount
 * of children and public access to modifying this list of children.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export abstract class MultiParent<W extends Widget = Widget> extends Parent<W> {
    /**
     * This widget's children. Note that this is marked as readonly so that it
     * cannot be accidentally replaced with a new array. This way, references to
     * this array are always valid. If you want to clear this array, set the
     * length to zero instead of creating a new instance. readonly still means
     * that you can add/remove elements to/from the array.
     */
    protected readonly _children: Array<W>;

    constructor(children: Array<W>, properties?: Readonly<WidgetProperties>) {
        super(properties);

        this._children = [...children];
    }

    override [Symbol.iterator](): Iterator<W> {
        const children = [...this._children];
        const childCount = children.length;
        let index = 0;

        return <Iterator<W>>{
            next() {
                if (index >= childCount || index < 0) {
                    return { value: undefined, done: true };
                } else {
                    return { value: children[index++], done: false };
                }
            }
        }
    }

    override get childCount(): number {
        return this._children.length;
    }

    /**
     * Add child(ren) to this widget.
     *
     * {@link Widget#_layoutDirty} is set to true and each child's
     * {@link Widget#inheritedTheme} is set so that new children inherit this
     * widget's theme.
     *
     * Calls {@link Widget#markWholeAsDirty}.
     *
     * @param children - If this is a widget, then it is pushed to {@link MultiParent#_children}. If this is an array of widgets, then each widget is pushed to {@link MultiParent#_children}.
     * @returns Returns this so that the method is chainable.
     */
    add(children: W | Array<W>): this {
        if(Array.isArray(children)) {
            const isAttached = this.attached;

            for(const child of children) {
                this._children.push(child);
                child.inheritedTheme = this.inheritedTheme;

                if(isAttached) {
                    child.attach(this.root, this.viewport, this);
                }
            }
        } else {
            this._children.push(children);
            children.inheritedTheme = this.inheritedTheme;

            if(this.attached) {
                children.attach(this.root, this.viewport, this);
            }
        }

        this._layoutDirty = true;
        this.markWholeAsDirty();
        return this;
    }

    /**
     * Remove child(ren) from this widget.
     *
     * Calls {@link Widget#markWholeAsDirty} and sets
     * {@link Widget#_layoutDirty} to true.
     *
     * @param children - If this is a widget, then it is removed from {@link MultiParent#_children}. If this is an array of widgets, then each widget is removed from {@link MultiParent#_children}.
     * @returns Returns this so that the method is chainable.
     */
    remove(children: W | Array<W>): this {
        const isAttached = this.attached;

        if(Array.isArray(children)) {
            for(const child of children) {
                const pos = this._children.indexOf(child);

                if(pos !== -1) {
                    this._children.splice(pos, 1);
                }
                if(isAttached) {
                    child.detach();
                }
            }
        } else {
            const pos = this._children.indexOf(children);

            if(pos !== -1) {
                this._children.splice(pos, 1);
            }
            if(isAttached) {
                children.detach();
            }
        }

        this._layoutDirty = true;
        this.markWholeAsDirty();
        return this;
    }

    /**
     * Remove all children from this widget.
     *
     * Calls {@link Widget#markWholeAsDirty} and sets
     * {@link Widget#_layoutDirty} to true.
     *
     * @returns Returns this so that the method is chainable.
     */
    clearChildren(): this {
        if(this.attached) {
            for(const child of this._children) {
                child.detach();
            }
        }

        this._children.length = 0;
        this._layoutDirty = true;
        this.markWholeAsDirty();
        return this;
    }
}
