import { BaseContainer } from './BaseContainer';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig';

import type { Widget, WidgetProperties } from './Widget';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

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
