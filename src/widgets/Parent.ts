import { Widget } from '../widgets/Widget.js';
import type { Theme } from '../theme/Theme.js';

/**
 * A class for widgets which may have children.
 *
 * Overrides the {@link Widget#inheritedTheme} accessor so that inherited themes
 * are propagated to children. Also provides a getter for the amount of children
 * that this parent has, and is an iterable which iterates each child of this
 * parent. Child classes are responsible for implementing both the getter and
 * the iterator.
 *
 * Can be constrained to a specific type of children.
 *
 * See {@link MultiParent} and {@link SingleParent} for more specialised
 * versions.
 *
 * @category Widget
 */
export abstract class Parent<W extends Widget = Widget> extends Widget implements Iterable<W> {
    /**
     * Get iterator for children of this parent widget. Cannot modify list of
     * children via this iterator; for read-only purposes only.
     */
    abstract [Symbol.iterator](): Iterator<W>;

    /** Get amount of children of this parent widget. */
    abstract get childCount(): number;

    override set inheritedTheme(theme: Theme | undefined) {
        super.inheritedTheme = theme;
        for(const child of this) {
            child.inheritedTheme = theme;
        }
    }

    override get inheritedTheme(): Theme | undefined {
        return super.inheritedTheme;
    }

    protected override handleAttachment(): void {
        for(const child of this) {
            child.attach(this._root!, this._viewport!, this);
        }
    }

    protected override handleDetachment(): void {
        for(const child of this) {
            child.detach();
        }
    }

    override updateActiveState(): boolean {
        const changed = super.updateActiveState();

        if(changed) {
            for(const child of this) {
                child.updateActiveState();
            }
        }

        return changed;
    }

    override finalizeBounds() {
        super.finalizeBounds();

        for(const child of this) {
            child.finalizeBounds();
        }
    }
}
