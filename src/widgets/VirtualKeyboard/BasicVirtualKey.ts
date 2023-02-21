import type { WidgetAutoXML } from '../../xml/WidgetAutoXML';
import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';
import { VirtualKey } from './VirtualKey';

/**
 * A {@link VirtualKey} which emits key presses of a given key code.
 *
 * @category Widget
 */
export class BasicVirtualKey extends VirtualKey {
    static override autoXML: WidgetAutoXML = [
        {
            mode: 'text',
            name: 'text'
        },
        {
            name: 'key-code',
            mode: 'value',
            validator: 'string',
        },
        {
            name: 'key-context',
            mode: 'value',
            validator: 'key-context',
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
     * @param keyCode - The {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values | key code} to emit in the keyContext's callback when the virtual key is pressed
     * @param keyContext - The {@link KeyContext} shared by other virtual keyboard key widgets.
     */
    constructor(text: string, keyCode: string, keyContext: KeyContext, minWidth = 24, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super(
            text,
            () => keyContext.callback(keyCode),
            minWidth,
            minHeight,
            properties,
        );
    }
}
