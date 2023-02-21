import { Icon, IconProperties } from './Icon';
import { Button } from './Button';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';

/**
 * A {@link Button} with an {@link Icon}.
 *
 * @category Widget
 */
export class IconButton extends Button<Icon> {
    static override autoXML: WidgetAutoXML = [
        {
            mode: 'value',
            name: 'image',
            validator: 'image-source'
        }
    ];

    constructor(image: HTMLImageElement, properties?: Readonly<IconProperties & ClickableWidgetProperties>) {
        super(new Icon(image, properties), properties);
    }
}
