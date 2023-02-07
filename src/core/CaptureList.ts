import type { Event } from '../events/Event';

/**
 * A list of pairs. Each pair contains, in this order, the event that was
 * dispatched, and whether it was captured.
 *
 * @category Core
 */
export type CaptureList = Array<[event: Event, captured: boolean]>;
