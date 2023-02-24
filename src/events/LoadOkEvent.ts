import type { Widget } from '../widgets/Widget';
import { BubblingEvent } from './BubblingEvent';

/**
 * An event that is fired when a resource finishes loading.
 *
 * @category Event
 */
export class LoadOkEvent<R> extends BubblingEvent {
    static override readonly type = 'load-ok';
    override readonly type: typeof LoadOkEvent.type;
    override readonly userCapturable: false;

    /** The resource that was loaded successfully. */
    readonly resource: R;

    constructor(origin: Widget, resource: R) {
        super(origin);

        this.type = LoadOkEvent.type;
        this.userCapturable = false;
        this.resource = resource;
    }
}
