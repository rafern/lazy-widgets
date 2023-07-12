import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import { Label } from './Label.js';
import { Tooltip } from './Tooltip.js';
import { TooltipContainer } from './TooltipContainer.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { Widget, WidgetProperties } from './Widget.js';
/**
 * A convenience widget for a {@link Tooltip} that has a {@link Label}.
 *
 * @category Widget
 */
export class TextTooltip<W extends Widget = Widget> extends Tooltip<W, TooltipContainer<Label>> {
    static override autoXML: WidgetAutoXML = {
        name: 'text-tooltip',
        inputConfig: [
            {
                mode: 'widget',
                name: 'child'
            },
            {
                mode: 'text',
                name: 'tooltip-text'
            }
        ]
    };

    constructor(child: W, tooltipText: string, properties?: Readonly<WidgetProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);

        super(
            child,
            new TooltipContainer(
                new Label(
                    tooltipText,
                    {
                        ...propertiesNoID,
                        wrapText: false
                    }
                ),
                propertiesNoID
            ),
            properties
        )
    }
}
