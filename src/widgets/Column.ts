import type { Widget, WidgetProperties } from './Widget';
import { MultiContainer } from './MultiContainer';

/**
 * A vertical {@link MultiContainer}.
 *
 * @category Widget
 * @category Alias Widget
 */
export class Column<W extends Widget = Widget> extends MultiContainer<W> {
    constructor(properties?: Readonly<WidgetProperties>) {
        super(true, properties);
    }
}
