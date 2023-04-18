import { BaseContainer } from './BaseContainer.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';

import type { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';

/**
 * A {@link BaseContainer} which always propagates events. Use this widget if
 * you are not sure what that means.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class Container<W extends Widget = Widget> extends BaseContainer<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'container',
        inputConfig: SingleParentXMLInputConfig
    };

    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, properties);
    }
}
