import { BasicVirtualKey } from './BasicVirtualKey';
import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';

/**
 * A {@link BasicVirtualKey} which emits 'Backspace' key presses.
 *
 * @category Widget
 * @category Alias Widget
 */
export class BackspaceKey extends BasicVirtualKey {
    /** Create a new BackspaceKey. */
    constructor(keyContext: KeyContext, minWidth = 60, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Backspace', 'Backspace', keyContext, minWidth, minHeight, properties);
    }
}
