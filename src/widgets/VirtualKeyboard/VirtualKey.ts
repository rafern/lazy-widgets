import { ArtificialConstraint } from '../ArtificialConstraint';
import type { WidgetProperties } from '../Widget';
import { TextButton } from '../TextButton';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML';

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
    static override autoXML: WidgetAutoXML = [
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
    ];

    /**
     * @param text - The text to display in the virtual key.
     * @param callback - The callback called when the button is pressed.
     * @param minWidth - Minimum width constraint. Will be passed to ArtificialConstraint base class.
     * @param minHeight - Minimum width constraint. Will be passed to ArtificialConstraint base class.
     */
    constructor(text: string, callback: () => void, minWidth = 24, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super(
            new TextButton(text, callback, properties),
            [minWidth, Infinity, minHeight, Infinity],
            properties,
        );
    }
}
