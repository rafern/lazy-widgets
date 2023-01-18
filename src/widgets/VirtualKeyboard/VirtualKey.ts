import { ArtificialConstraint } from '../ArtificialConstraint';
import type { WidgetProperties } from '../Widget';
import { TextButton } from '../TextButton';

/**
 * An {@link ArtificialConstraint} with a {@link TextButton} which calls a given
 * callback and displays a given text source.
 *
 * For now there's nothing special about this class; it's just a common base
 * class for virtual keyboard key widgets.
 *
 * @category Widget
 * @category Aggregate Widget
 */
export class VirtualKey extends ArtificialConstraint<TextButton> {
    /**
     * Create a new VirtualKey.
     *
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
