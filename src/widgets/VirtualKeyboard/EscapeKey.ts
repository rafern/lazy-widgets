import { BasicVirtualKey } from './BasicVirtualKey';
import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig';

import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML';

/**
 * A {@link BasicVirtualKey} which emits 'Escape' key presses.
 *
 * @category Widget
 */
export class EscapeKey extends BasicVirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'escape-key',
        inputConfig: SpecializedVirtualKeyXMLInputConfig
    };

    constructor(keyContext: KeyContext, minWidth = 48, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Esc', 'Escape', keyContext, minWidth, minHeight, properties);
    }
}
