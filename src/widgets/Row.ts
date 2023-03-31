import { MultiContainer } from './MultiContainer';
import { MultiParentXMLInputConfig } from '../xml/MultiParentXMLInputConfig';

import type { Widget, WidgetProperties } from './Widget';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

/**
 * A horizontal {@link MultiContainer}.
 *
 * @category Widget
 */
export class Row<W extends Widget = Widget> extends MultiContainer<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'row',
        inputConfig: MultiParentXMLInputConfig
    };

    constructor(children?: Array<W>, properties?: Readonly<WidgetProperties>) {
        super(false, children, properties);
    }
}
