import { MultiContainer } from './MultiContainer';
import { MultiParentXMLInputConfig } from '../xml/MultiParentXMLInputConfig';

import type { Widget, WidgetProperties } from './Widget';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

/**
 * A vertical {@link MultiContainer}.
 *
 * @category Widget
 */
export class Column<W extends Widget = Widget> extends MultiContainer<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'column',
        inputConfig: MultiParentXMLInputConfig
    };

    constructor(children?: Array<W>, properties?: Readonly<WidgetProperties>) {
        super(true, children, properties);
    }
}
