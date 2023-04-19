import type { Widget } from '../widgets/Widget.js';

/**
 * A function that returns a new instance of a {@link Widget} given a list of
 * arguments.
 *
 * @category XML
 */
export type XMLWidgetFactory = (...args: unknown[]) => Widget;
