import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig.js';
import { VirtualKey } from './VirtualKey.js';
import type { WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A {@link VirtualKey} which acts as a shift key; toggles
 * {@link KeyContext#shift} on click.
 *
 * @category Widget
 */
export class ShiftKey extends VirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'shift-key',
        inputConfig: SpecializedVirtualKeyXMLInputConfig
    };

    constructor(keyContext: KeyContext, properties?: Readonly<WidgetProperties>) {
        super(
            'Shift',
            () => {
                keyContext.shift = !keyContext.shift;
                this.forced = keyContext.shift;
                keyContext.callback('Shift');
            },
            {
                minWidth: 84,
                ...properties,
            }
        );

        this.forced = keyContext.shift;
    }
}
