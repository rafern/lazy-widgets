import type { Widget, WidgetProperties } from './Widget';
import { BaseContainer } from './BaseContainer';

/**
 * A {@link BaseContainer} which always propagates events. Use this widget if
 * you are not sure what that means.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 * @category Alias Widget
 */
export class Container<W extends Widget = Widget> extends BaseContainer<W> {
    /** Create a new Container. */
    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, true, properties);
    }
}
