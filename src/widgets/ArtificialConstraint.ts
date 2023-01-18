import type { LayoutConstraints } from '../core/LayoutConstraints';
import { layoutArrayField } from '../decorators/FlagFields';
import type { Widget, WidgetProperties } from './Widget';
import { PassthroughWidget } from './PassthroughWidget';

/**
 * A {@link PassthroughWidget} which imposes further layout constraints onto a
 * child.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class ArtificialConstraint<W extends Widget = Widget> extends PassthroughWidget<W> {
    /**
     * The further constraints given to the child. A 4-tuple containing,
     * respectively, minimum width, maximum width, minimum height and maximum
     * height. Changing this sets {@link Widget#_layoutDirty} to true.
     * Constraints are only applied if they are more restrictive than the
     * original constraints.
     *
     * Will be automatically scaled depending on the current {@link Root}'s
     * resolution.
     *
     * @decorator `@layoutArrayField()`
     */
    @layoutArrayField()
    constraints: LayoutConstraints;

    /** Create a new PassthroughWidget. */
    constructor(child: W, constraints: LayoutConstraints, properties?: Readonly<WidgetProperties>) {
        super(child, properties);

        this.constraints = [...constraints];
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Further restrict constraints if possible
        let newMinWidth = Math.min(Math.max(this.constraints[0], minWidth), maxWidth);
        let newMinHeight = Math.min(Math.max(this.constraints[2], minHeight), maxHeight);
        const newMaxWidth = Math.min(Math.max(this.constraints[1], minWidth), maxWidth);
        const newMaxHeight = Math.min(Math.max(this.constraints[3], minHeight), maxHeight);

        if(newMinWidth > newMaxWidth)
            newMinWidth = newMaxWidth;

        if(newMinHeight > newMaxHeight)
            newMinHeight = newMaxHeight;

        // Resolve dimensions
        super.handleResolveDimensions(newMinWidth, newMaxWidth, newMinHeight, newMaxHeight);
    }
}