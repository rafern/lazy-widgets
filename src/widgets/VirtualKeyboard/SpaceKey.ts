import { BasicVirtualKey } from './BasicVirtualKey.js';
import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig.js';
import type { WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A {@link BasicVirtualKey} which emits ' ' key presses.
 *
 * @category Widget
 */
export class SpaceKey extends BasicVirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'space-key',
        inputConfig: SpecializedVirtualKeyXMLInputConfig
    };

    constructor(keyContext: KeyContext, properties?: Readonly<WidgetProperties>) {
        super('Space', ' ', keyContext, {
            flex: 1, minWidth: 84, ...properties
        });
    }
}
