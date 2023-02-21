import type { Widget, WidgetProperties } from './Widget';
import { MultiContainer } from './MultiContainer';
import { MultiParentAutoXML } from '../xml/MultiParentAutoXML';

/**
 * A vertical {@link MultiContainer}.
 *
 * @category Widget
 */
export class Column<W extends Widget = Widget> extends MultiContainer<W> {
    static override autoXML = MultiParentAutoXML;

    constructor(children?: Array<W>, properties?: Readonly<WidgetProperties>) {
        super(true, children, properties);
    }
}
