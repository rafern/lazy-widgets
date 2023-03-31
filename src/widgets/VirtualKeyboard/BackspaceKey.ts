import { BasicVirtualKey } from './BasicVirtualKey';
import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig';

import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML';

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
