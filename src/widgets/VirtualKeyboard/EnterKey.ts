import { BasicVirtualKey } from './BasicVirtualKey';
import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig';

import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML';

/**
 * A {@link BasicVirtualKey} which emits 'Enter' key presses.
 *
 * @category Widget
 */
export class EnterKey extends BasicVirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'enter-key',
        inputConfig: SpecializedVirtualKeyXMLInputConfig
    };

    constructor(keyContext: KeyContext, minWidth = 72, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Enter', 'Enter', keyContext, minWidth, minHeight, properties);
    }
}
