import { StickyEvent } from './StickyEvent.js';
/**
 * Signals to a {@link Root} that the pointer is no longer hovering it. This
 * will result in new {@link LeaveEvent | LeaveEvents} being dispatched to
 * hovered {@link Widget | Widgets}.
 *
 * @category Event
 */
export class LeaveRootEvent extends StickyEvent {
    static override readonly type = 'leave-root';
    override readonly type: typeof LeaveRootEvent.type;
    override readonly userCapturable: false;

    constructor() {
        super();

        this.type = LeaveRootEvent.type;
        this.userCapturable = false;
    }
}
