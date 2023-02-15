import { BasicVirtualKey } from './BasicVirtualKey';
import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';
import { SpecializedVirtualKeyAutoXML } from '../../xml/SpecializedVirtualKeyAutoXML';

/**
 * A {@link BasicVirtualKey} which emits 'Escape' key presses.
 *
 * @category Widget
 * @category Alias Widget
 */
export class EscapeKey extends BasicVirtualKey {
    static override autoXML = SpecializedVirtualKeyAutoXML;

    constructor(keyContext: KeyContext, minWidth = 48, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Esc', 'Escape', keyContext, minWidth, minHeight, properties);
    }
}
