import type { WidgetProperties } from '../Widget';
import type { KeyContext } from './KeyContext';
import { VirtualKey } from './VirtualKey';

/**
 * A {@link VirtualKey} which acts as an alt key; toggles
 * {@link KeyContext#alt} on click.
 *
 * @category Widget
 * @category Alias Widget
 */
export class AltKey extends VirtualKey {
    /** Create a new AltKey. */
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
