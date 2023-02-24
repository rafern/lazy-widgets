import type { Widget } from '../widgets/Widget';
import { BubblingEvent } from './BubblingEvent';

/**
 * An event that is fired when a resource fails to load.
 *
 * @category Event
 */
export class LoadErrorEvent<R> extends BubblingEvent {
    static override readonly type = 'load-error';
    override readonly type: typeof LoadErrorEvent.type;
    override readonly userCapturable: false;

    /** The resource that failed to load. */
    readonly resource: R;
    /** The error that occurred while loading the resource. */
    readonly error: unknown;

    constructor(origin: Widget, resource: R, error: unknown) {
        super(origin);

        this.type = LoadErrorEvent.type;
        this.userCapturable = false;
        this.resource = resource;
        this.error = error;
    }
}
