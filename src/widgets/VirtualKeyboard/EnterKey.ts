import { BasicVirtualKey } from './BasicVirtualKey';
import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';

/**
 * A {@link BasicVirtualKey} which emits 'Enter' key presses.
 *
 * @category Widget
 * @category Alias Widget
 */
export class EnterKey extends BasicVirtualKey {
    /** Create a new EnterKey. */
    constructor(keyContext: KeyContext, minWidth = 72, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super('Enter', 'Enter', keyContext, minWidth, minHeight, properties);
    }
}
