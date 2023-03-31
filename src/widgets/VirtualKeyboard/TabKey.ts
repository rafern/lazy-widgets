import { BasicVirtualKey } from './BasicVirtualKey';
import { SpecializedVirtualKeyAutoXML } from '../../xml/SpecializedVirtualKeyAutoXML';

import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';

/**
 * A {@link BasicVirtualKey} which emits 'Tab' key presses. Does not trigger tab
 * selection.
 *
 * @category Widget
 */
export class TabKey extends BasicVirtualKey {
    static override autoXML = SpecializedVirtualKeyAutoXML;

    constructor(keyContext: KeyContext, minWidth = 48, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Tab', 'Tab', keyContext, minWidth, minHeight, properties);
    }
}
