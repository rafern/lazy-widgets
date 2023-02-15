import { FocusType} from '../core/FocusType';
import { Widget } from '../widgets/Widget';
import { TargetableTricklingEvent } from './TargetableTricklingEvent';

/**
 * A leave {@link TricklingEvent}. Dispatched when the pointer leaves the root
 * or the focus capturer changes to another widget.
 *
 * Has a focus type of {@link FocusType.Pointer} and needs focus.
 *
 * @category Event
 */
export class LeaveEvent extends TargetableTricklingEvent {
    static override readonly type = 'leave';
    override readonly type: typeof LeaveEvent.type;
    override readonly focusType: FocusType.Pointer;
    override readonly needsFocus: true;
    override readonly userCapturable: false;

    constructor(target: Widget | null = null) {
        super(target);

        this.type = LeaveEvent.type;
        this.focusType = FocusType.Pointer;
        this.needsFocus = true;
        this.userCapturable = false;
    }

    cloneWithTarget(target: Widget | null): LeaveEvent {
        return new LeaveEvent(target);
    }
}
