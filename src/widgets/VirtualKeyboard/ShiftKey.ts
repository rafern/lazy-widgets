import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';
import { VirtualKey } from './VirtualKey';

/**
 * A {@link VirtualKey} which acts as a shift key; toggles
 * {@link KeyContext#shift} on click.
 *
 * @category Widget
 * @category Alias Widget
 */
export class ShiftKey extends VirtualKey {
    /** Create a new ShiftKey. */
    constructor(keyContext: KeyContext, minWidth = 84, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super(
            'Shift',
            () => {
                keyContext.shift = !keyContext.shift;
                this.child.forced = keyContext.shift;
                keyContext.callback('Shift');
            },
            minWidth,
            minHeight,
            properties,
        );

        this.child.forced = keyContext.shift;
    }
}
