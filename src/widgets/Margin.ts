import { Alignment } from '../theme/Alignment.js';
import { Container } from './Container.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import type { Alignment2D } from '../theme/Alignment2D.js';
import type { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
/**
 * A {@link Container} with center alignment on both axes and default padding,
 * similar to {@link Center}.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class Margin<W extends Widget = Widget> extends Container<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'margin',
        inputConfig: SingleParentXMLInputConfig
    };

    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        properties = {
            containerAlignment: <Alignment2D>{
                horizontal: Alignment.Center, vertical: Alignment.Center,
            },
            ...properties
        };

        super(child, properties);
    }
}
