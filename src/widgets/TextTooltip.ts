import { filterIDFromProperties } from '../helpers/filterIDFromProperties';
import { Label } from './Label';
import { Tooltip } from './Tooltip';
import { TooltipContainer } from './TooltipContainer';

import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { Widget, WidgetProperties } from './Widget';

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
