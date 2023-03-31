import { SpecializedVirtualKeyAutoXML } from '../../xml/SpecializedVirtualKeyAutoXML';
import { VirtualKey } from './VirtualKey';

import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';

/**
 * A {@link VirtualKey} which acts as an alt key; toggles
 * {@link KeyContext#alt} on click.
 *
 * @category Widget
 */
export class AltKey extends VirtualKey {
    static override autoXML = SpecializedVirtualKeyAutoXML;

    constructor(keyContext: KeyContext, minWidth = 42, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super(
            'Alt',
            () => {
                keyContext.alt = !keyContext.alt;
                this.child.forced = keyContext.alt;
                keyContext.callback('Alt');
            },
            minWidth,
            minHeight,
            properties,
        );

        this.child.forced = keyContext.alt;
    }
}
