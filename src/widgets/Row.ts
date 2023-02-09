import type { Widget, WidgetProperties } from './Widget';
import { MultiContainer } from './MultiContainer';

/**
 * A horizontal {@link MultiContainer}.
 *
 * @category Widget
 * @category Alias Widget
 */
export class Row<W extends Widget = Widget> extends MultiContainer<W> {
    constructor(properties?: Readonly<WidgetProperties>) {
        super(false, properties);
    }
}
