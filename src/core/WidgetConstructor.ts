import { Widget } from '../widgets/Widget.js';

/**
 * A generic {@link Widget} constructor. Useful for using Widget factories as
 * parameters.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WidgetConstructor<T extends Widget = Widget> = new (...args: any[]) => T;
