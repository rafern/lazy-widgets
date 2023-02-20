import { Widget } from '../widgets/Widget';

export function validateWidget(value: unknown): [value: Widget, stop: boolean] {
    if (!(value instanceof Widget)) {
        throw new Error('Invalid Widget; not a Widget instance');
    }

    return [value, false];
}
