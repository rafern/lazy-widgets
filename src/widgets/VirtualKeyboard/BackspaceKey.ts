import { BasicVirtualKey } from './BasicVirtualKey';
import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';
import { SpecializedVirtualKeyAutoXML } from '../../xml/SpecializedVirtualKeyAutoXML';

/**
 * A {@link BasicVirtualKey} which emits 'Backspace' key presses.
 *
 * @category Widget
 * @category Alias Widget
 */
export class BackspaceKey extends BasicVirtualKey {
    static override autoXML = SpecializedVirtualKeyAutoXML;

    constructor(keyContext: KeyContext, minWidth = 60, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Backspace', 'Backspace', keyContext, minWidth, minHeight, properties);
    }
}
