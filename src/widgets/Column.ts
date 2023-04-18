import { MultiContainer } from './MultiContainer.js';
import { MultiParentXMLInputConfig } from '../xml/MultiParentXMLInputConfig.js';

import type { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';

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
