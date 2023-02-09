import type { TricklingEvent } from '../events/TricklingEvent';

/**
 * A list of pairs. Each pair contains, in this order, the event that was
 * dispatched, and whether it was captured.
 *
 * @category Core
 */
export type CaptureList = Array<[event: TricklingEvent, captured: boolean]>;
