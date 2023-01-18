import type { Widget, WidgetProperties } from './Widget';
import type { Alignment2D } from '../theme/Alignment2D';
import { Alignment } from '../theme/Alignment';
import { Container } from './Container';

/**
 * A {@link Margin} which stretches on the vertical axis. Useful for
 * horizontally centering labels without making them look weird if they are in
 * a row.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 * @category Alias Widget
 */
export class TextMargin<W extends Widget = Widget> extends Container<W> {
    /** Create a new TextMargin. */
    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        // default properties
        properties = {
            containerAlignment: <Alignment2D>{
                horizontal: Alignment.Center, vertical: Alignment.Stretch,
            },
            ...properties
        };

        super(child, properties);
    }
}
