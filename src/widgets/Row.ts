import { MultiContainer } from './MultiContainer';
import { MultiParentAutoXML } from '../xml/MultiParentAutoXML';

import type { Widget, WidgetProperties } from './Widget';

/**
 * A horizontal {@link MultiContainer}.
 *
 * @category Widget
 */
export class Row<W extends Widget = Widget> extends MultiContainer<W> {
    static override autoXML = MultiParentAutoXML;

    constructor(children?: Array<W>, properties?: Readonly<WidgetProperties>) {
        super(false, children, properties);
    }
}
