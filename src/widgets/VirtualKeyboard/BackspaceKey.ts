import { BasicVirtualKey } from './BasicVirtualKey.js';
import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig.js';
import type { WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A {@link BasicVirtualKey} which emits 'Backspace' key presses.
 *
 * @category Widget
 */
export class BackspaceKey extends BasicVirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'backspace-key',
        inputConfig: SpecializedVirtualKeyXMLInputConfig
    };

    constructor(keyContext: KeyContext, minWidth = 60, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Backspace', 'Backspace', keyContext, minWidth, minHeight, properties);
    }
}
