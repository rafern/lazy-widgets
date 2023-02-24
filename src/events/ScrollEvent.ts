import type { Widget } from '../widgets/Widget';
import { BubblingEvent } from './BubblingEvent';

/**
 * An event that is fired when a scrollable widget such as
 * {@link ScrollableViewportWidget} is scrolled.
 *
 * @category Event
 */
export class ScrollEvent extends BubblingEvent {
    static override readonly type = 'scroll';
    override readonly type: typeof ScrollEvent.type;
    override readonly userCapturable: false;

    /** How many pixels has the scroll offset changed by, horizontally? */
    readonly deltaX: number;
    /** How many pixels has the scroll offset changed by, vertically? */
    readonly deltaY: number;

    constructor(origin: Widget, deltaX: number, deltaY: number) {
        super(origin);

        this.type = ScrollEvent.type;
        this.userCapturable = false;
        this.deltaX = deltaX;
        this.deltaY = deltaY;
    }
}
