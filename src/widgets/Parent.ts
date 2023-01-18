import { Widget, WidgetProperties } from '../widgets/Widget';
import type { Viewport } from '../core/Viewport';
import type { Theme } from '../theme/Theme';
import type { Root } from '../core/Root';

/**
 * A class for widgets which may have children.
 *
 * Overrides the {@link Widget#inheritedTheme} accessor so that inherited themes
 * are propagated to children, and {@link Widget#dryPaint} so that dry painting
 * this parent also dry paints the children. Also provides utilities for getting
 * the amount of children, a public iterator for children and a protected child
 * list. This way, widgets that extend this class can decide if modifying the
 * list of children should be public or not.
 *
 * Can be constrained to a specific type of children.
 *
 * See {@link MultiParent} and {@link SingleParent} for more specialised
 * versions.
 *
 * @category Widget
 */
export abstract class Parent<W extends Widget = Widget> extends Widget {
    /**
     * This widget's children. Note that this is marked as readonly so that it
     * cannot be accidentally replaced with a new array. This way, references to
     * this array are always valid. If you want to clear this array, set the
     * length to zero instead of creating a new instance. readonly still means
     * that you can add/remove elements to/from the array.
     *
     * See {@link Parent#children} for the public iterator getter.
     */
    protected readonly _children: Array<W>;

    /**
     * Create a new Parent. Automatically adds all widgets in the input array
     * to {@link Parent#_children}.
     */
    constructor(children: Array<W>, needsClear: boolean, propagatesEvents: boolean, properties?: Readonly<WidgetProperties>) {
        super(needsClear, propagatesEvents, properties);

        this._children = [...children];
    }

    override set inheritedTheme(theme: Theme | undefined) {
        super.inheritedTheme = theme;
        for(const child of this.children)
            child.inheritedTheme = theme;
    }

    override get inheritedTheme(): Theme | undefined {
        return super.inheritedTheme;
    }

    override dryPaint(): void {
        super.dryPaint();

        for(const child of this.children)
            child.dryPaint();
    }

    override forceDirty(markLayout = true): void {
        super.forceDirty(markLayout);

        for(const child of this.children)
            child.forceDirty(markLayout);
    }

    /** Get amount of children of this parent widget. */
    get childCount(): number {
        return this._children.length;
    }

    /**
     * Get iterator for children of this parent widget. Cannot modify list of
     * children via this iterator; for read-only purposes only.
     */
    get children(): Iterable<W> {
        return this._children.values();
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        super.attach(root, viewport, parent);

        for(const child of this.children)
            child.attach(root, viewport, this);
    }

    override detach(): void {
        super.detach();

        for(const child of this.children)
            child.detach();
    }

    override updateActiveState(): boolean {
        const changed = super.updateActiveState();

        if(changed) {
            for(const child of this._children)
                child.updateActiveState();
        }

        return changed;
    }

    override finalizeBounds() {
        super.finalizeBounds();

        for(const child of this.children)
            child.finalizeBounds();
    }
}