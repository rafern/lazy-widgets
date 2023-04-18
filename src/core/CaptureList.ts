import type { WidgetEvent } from '../events/WidgetEvent.js';

/**
 * A list of pairs. Each pair contains, in this order, the event that was
 * dispatched, and whether it was captured.
 *
 * @category Core
 */
export type CaptureList = Array<[event: WidgetEvent, captured: boolean]>;
