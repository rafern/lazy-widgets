import { BubblingEvent } from './BubblingEvent.js';
import type { Widget } from '../widgets/Widget.js';
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

    /** The new horizontal offset */
    readonly offsetX: number;
    /** The new vertical offset */
    readonly offsetY: number;
    /** How many pixels has the scroll offset changed by, horizontally? */
    readonly deltaX: number;
    /** How many pixels has the scroll offset changed by, vertically? */
    readonly deltaY: number;

    constructor(origin: Widget, offsetX: number, offsetY: number, deltaX: number, deltaY: number) {
        super(origin);

        this.type = ScrollEvent.type;
        this.userCapturable = false;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.deltaX = deltaX;
        this.deltaY = deltaY;
    }
}
