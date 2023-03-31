import { Icon, IconProperties } from './Icon';
import { Button } from './Button';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';

import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';

/**
 * A {@link Button} with an {@link Icon}.
 *
 * @category Widget
 */
export class IconButton extends Button<Icon> {
    static override autoXML: WidgetAutoXML = {
        name: 'icon-button',
        inputConfig: [
            {
                mode: 'value',
                name: 'image',
                validator: 'image-source'
            }
        ]
    };

    constructor(image: HTMLImageElement, properties?: Readonly<IconProperties & ClickableWidgetProperties>) {
        super(new Icon(image, filterIDFromProperties(properties)), properties);
    }
}
