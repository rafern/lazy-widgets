import { FocusType} from '../core/FocusType.js';
import { Widget } from '../widgets/Widget.js';
import { TargetableTricklingEvent } from './TargetableTricklingEvent.js';
/**
 * A leave {@link TricklingEvent}. Dispatched when a pointer is no longer over
 * a specific widget (other libraries may call this an unhover event).
 *
 * If a pointer event never visits a widget, even when the event is in the
 * bounds of the widget, then the widget will never get a leave event dispatched
 * to it. This is done by tracking the list of widgets that get visited by a
 * pointer event every time a pointer event is dispatched. This is done
 * automatically by the {@link Widget} and {@link Root} classes.
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
