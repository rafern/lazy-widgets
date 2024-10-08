import { VirtualKey } from './VirtualKey.js';
import type { WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A {@link VirtualKey} which emits key presses of a given key code.
 *
 * @category Widget
 */
export class BasicVirtualKey extends VirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'basic-virtual-key',
        inputConfig: [
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
        ]
    };

    /**
     * @param text - The text to display in the virtual key.
     * @param keyCode - The {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values | key code} to emit in the keyContext's callback when the virtual key is pressed
     * @param keyContext - The {@link KeyContext} shared by other virtual keyboard key widgets.
     */
    constructor(text: string, keyCode: string, keyContext: KeyContext, properties?: Readonly<WidgetProperties>) {
        super(
            text,
            () => keyContext.callback(keyCode),
            properties
        );
    }
}
