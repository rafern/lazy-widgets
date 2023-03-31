import { Alignment } from '../theme/Alignment';
import { Container } from './Container';

import type { Widget, WidgetProperties } from './Widget';
import type { Alignment2D } from '../theme/Alignment2D';
import type { Padding } from '../theme/Padding';

/**
 * A {@link Container} with center alignment on both axes and no padding by
 * default.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class Center<W extends Widget = Widget> extends Container<W> {
    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        properties = {
            containerAlignment: <Alignment2D>{
                horizontal: Alignment.Center, vertical: Alignment.Center,
            },
            containerPadding: <Padding>{
                left: 0, right: 0, top: 0, bottom: 0,
            },
            ...properties
        };

        super(child, properties);
    }
}
