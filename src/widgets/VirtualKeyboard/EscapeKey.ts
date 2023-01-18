import { BasicVirtualKey } from './BasicVirtualKey';
import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';

/**
 * A {@link BasicVirtualKey} which emits 'Escape' key presses.
 *
 * @category Widget
 * @category Alias Widget
 */
export class EscapeKey extends BasicVirtualKey {
    /** Create a new EscapeKey. */
    constructor(keyContext: KeyContext, minWidth = 24, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Esc', 'Escape', keyContext, minWidth, minHeight, properties);
    }
}
