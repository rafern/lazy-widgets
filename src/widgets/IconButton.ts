import { Icon, IconProperties } from './Icon';
import { Button } from './Button';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

/**
 * A {@link Button} with an {@link Icon}.
 *
 * @category Widget
 * @category Aggregate Widget
 */
export class IconButton extends Button<Icon> {
    static override autoXML: WidgetAutoXML = [
        {
            mode: 'value',
            name: 'image',
            validator: 'image-source'
        },
        {
            mode: 'value',
            name: 'callback',
            validator: 'nullable:function'
        }
    ];

    constructor(image: HTMLImageElement, callback: (() => void) | null, properties?: Readonly<IconProperties>) {
        super(
            new Icon(image, properties),
            callback, properties
        );
    }
}
