import { BasicVirtualKey } from './BasicVirtualKey.js';
import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig.js';
import type { WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A {@link BasicVirtualKey} which emits 'Tab' key presses. Does not trigger tab
 * selection.
 *
 * @category Widget
 */
export class TabKey extends BasicVirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'tab-key',
        inputConfig: SpecializedVirtualKeyXMLInputConfig
    };

    constructor(keyContext: KeyContext, minWidth = 48, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Tab', 'Tab', keyContext, minWidth, minHeight, properties);
    }
}
