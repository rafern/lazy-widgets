import { MultiContainer } from './MultiContainer.js';
import { MultiParentXMLInputConfig } from '../xml/MultiParentXMLInputConfig.js';
import type { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
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
