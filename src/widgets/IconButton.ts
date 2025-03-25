import { Icon, IconProperties } from './Icon.js';
import { Button } from './Button.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import { type BackingMediaSource } from '../helpers/BackingMediaSource.js';
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

    constructor(image: BackingMediaSource | string, properties?: Readonly<IconProperties & ClickableWidgetProperties>) {
        super(new Icon(image, filterIDFromProperties(properties)), properties);
    }
}
