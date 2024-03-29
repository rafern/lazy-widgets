import { ArtificialConstraint } from '../ArtificialConstraint.js';
import { TextButton } from '../TextButton.js';
import { filterIDFromProperties } from '../../helpers/filterIDFromProperties.js';
import type { WidgetProperties } from '../Widget.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * An {@link ArtificialConstraint} with a {@link TextButton} which calls a given
 * callback and displays a given text source.
 *
 * For now there's nothing special about this class; it's just a common base
 * class for virtual keyboard key widgets.
 *
 * @category Widget
 */
export class VirtualKey extends ArtificialConstraint<TextButton> {
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
            {
                name: 'min-width',
                mode: 'value',
                validator: 'number',
                optional: true,
            },
            {
                name: 'min-height',
                mode: 'value',
                validator: 'number',
                optional: true,
            }
        ]
    };

    /**
     * @param text - The text to display in the virtual key.
     * @param callback - The callback called when the button is pressed.
     * @param minWidth - Minimum width constraint. Will be passed to ArtificialConstraint base class.
     * @param minHeight - Minimum width constraint. Will be passed to ArtificialConstraint base class.
     */
    constructor(text: string, callback: () => void, minWidth = 24, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super(
            new TextButton(text, filterIDFromProperties(properties)).on('click', callback),
            [minWidth, Infinity, minHeight, Infinity],
            properties,
        );
    }
}
