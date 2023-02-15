import { BasicVirtualKey } from './BasicVirtualKey';
import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';
import { SpecializedVirtualKeyAutoXML } from '../../xml/SpecializedVirtualKeyAutoXML';

/**
 * A {@link BasicVirtualKey} which emits ' ' key presses.
 *
 * @category Widget
 * @category Alias Widget
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
