import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig.js';
import { VirtualKey } from './VirtualKey.js';
import type { WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A {@link VirtualKey} which acts as an alt key; toggles
 * {@link KeyContext#alt} on click.
 *
 * @category Widget
 */
export class AltKey extends VirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'alt-key',
        inputConfig: SpecializedVirtualKeyXMLInputConfig
    };

    constructor(keyContext: KeyContext, properties?: Readonly<WidgetProperties>) {
        super(
            'Alt',
            () => {
                keyContext.alt = !keyContext.alt;
                this.forced = keyContext.alt;
                keyContext.callback('Alt');
            },
            { minWidth: 42, ...properties }
        );

        this.forced = keyContext.alt;
    }
}
