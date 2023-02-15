import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';
import { SpecializedVirtualKeyAutoXML } from '../../xml/SpecializedVirtualKeyAutoXML';
import { VirtualKey } from './VirtualKey';

/**
 * A {@link VirtualKey} which acts as a control key; toggles
 * {@link KeyContext#ctrl} on click.
 *
 * @category Widget
 * @category Alias Widget
 */
export class ControlKey extends VirtualKey {
    static override autoXML = SpecializedVirtualKeyAutoXML;

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
