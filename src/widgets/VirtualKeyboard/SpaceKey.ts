import { BasicVirtualKey } from './BasicVirtualKey';
import { SpecializedVirtualKeyAutoXML } from '../../xml/SpecializedVirtualKeyAutoXML';

import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';

/**
 * A {@link BasicVirtualKey} which emits ' ' key presses.
 *
 * @category Widget
 */
export class SpaceKey extends BasicVirtualKey {
    static override autoXML = SpecializedVirtualKeyAutoXML;

    constructor(keyContext: KeyContext, minWidth = 84, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        properties = {
            flex: 1,
            ...properties
        };

        super('Space', ' ', keyContext, minWidth, minHeight, properties);
    }
}
