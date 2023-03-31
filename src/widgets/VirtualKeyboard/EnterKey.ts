import { BasicVirtualKey } from './BasicVirtualKey';
import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig';

import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';

/**
 * A {@link BasicVirtualKey} which emits 'Enter' key presses.
 *
 * @category Widget
 */
export class EnterKey extends BasicVirtualKey {
    static override autoXML = SpecializedVirtualKeyXMLInputConfig;

    constructor(keyContext: KeyContext, minWidth = 72, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Enter', 'Enter', keyContext, minWidth, minHeight, properties);
    }
}
