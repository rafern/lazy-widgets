import { SpecializedVirtualKeyXMLInputConfig } from '../../xml/SpecializedVirtualKeyXMLInputConfig.js';
import { VirtualKey } from './VirtualKey.js';
import type { WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A {@link VirtualKey} which acts as a control key; toggles
 * {@link KeyContext#ctrl} on click.
 *
 * @category Widget
 */
export class ControlKey extends VirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'control-key',
        inputConfig: SpecializedVirtualKeyXMLInputConfig
    };

    constructor(keyContext: KeyContext, minWidth = 42, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super(
            'Ctrl',
            () => {
                keyContext.ctrl = !keyContext.ctrl;
                this.child.forced = keyContext.ctrl;
                keyContext.callback('Control');
            },
            minWidth,
            minHeight,
            properties,
        );

        this.child.forced = keyContext.ctrl;
    }
}
