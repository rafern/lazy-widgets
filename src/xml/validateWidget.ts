import { Widget } from '../widgets/Widget.js';

/**
 * A validator function which checks whether an input value is a {@link Widget}.
 * Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateWidget(value: unknown): [value: Widget, stop: boolean] {
    if (!(value instanceof Widget)) {
        throw new Error('Invalid Widget; not a Widget instance');
    }

    return [value, false];
}
