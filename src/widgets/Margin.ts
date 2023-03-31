import { Alignment } from '../theme/Alignment';
import { Container } from './Container';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig';

import type { ThemeProperties } from '../theme/ThemeProperties';
import type { Alignment2D } from '../theme/Alignment2D';
import type { Widget } from './Widget';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

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

    constructor(child: W, properties?: Readonly<ThemeProperties>) {
        properties = {
            containerAlignment: <Alignment2D>{
                horizontal: Alignment.Center, vertical: Alignment.Center,
            },
            ...properties
        };

        super(child, properties);
    }
}
