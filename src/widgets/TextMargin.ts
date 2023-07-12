import { Alignment } from '../theme/Alignment.js';
import { Container } from './Container.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import type { Widget, WidgetProperties } from './Widget.js';
import type { Alignment2D } from '../theme/Alignment2D.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
/**
 * A {@link Margin} which stretches on the vertical axis. Useful for
 * horizontally centering labels without making them look weird if they are in
 * a row.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class TextMargin<W extends Widget = Widget> extends Container<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'text-margin',
        inputConfig: SingleParentXMLInputConfig
    };

    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        // default properties
        properties = {
            containerAlignment: <Alignment2D>{
                horizontal: Alignment.Center, vertical: Alignment.Stretch,
            },
            ...properties
        };

        super(child, properties);
    }
}
