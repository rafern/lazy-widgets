import { TextButton } from '../TextButton.js';
import type { WidgetProperties } from '../Widget.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A {@link TextButton} which calls a given callback and displays a given text source.
 *
 * For now there's nothing special about this class; it's just a common base
 * class for virtual keyboard key widgets.
 *
 * @category Widget
 */
export class VirtualKey extends TextButton {
    static override autoXML: WidgetAutoXML = {
        name: 'virtual-key',
        inputConfig: [
            {
                mode: 'text',
                name: 'text'
            },
            {
                name: 'callback',
                mode: 'value',
                validator: 'function',
            },
        ]
    };

    /**
     * @param text - The text to display in the virtual key.
     * @param callback - The callback called when the button is pressed.
     */
    constructor(text: string, callback: () => void, properties?: Readonly<WidgetProperties>) {
        super(text, { minWidth: 24, minHeight: 24, ...properties });
        this.on('click', callback);
    }
}
