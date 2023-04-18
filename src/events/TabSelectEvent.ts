import { Widget } from '../widgets/Widget.js';
import { UntargetableTricklingEvent } from './UntargetableTricklingEvent.js';

/**
 * A tab selection {@link TricklingEvent}. Dispatched when tab is pressed and
 * either the keyboard-focused widget doesn't capture the event, or when
 * manually dispatched.
 *
 * For internal use only. Do not use this event unless you know what you're
 * doing.
 *
 * @category Event
 */
export class TabSelectEvent extends UntargetableTricklingEvent {
    static override readonly type = 'tab-select';
    override readonly type: typeof TabSelectEvent.type;
    override readonly focusType: null;
    override readonly needsFocus: false;
    override readonly userCapturable: true;

    /** The widget that the tab selected will be done relative to. */
    readonly relativeTo: Widget | null;
    /**
     * A working value; has the widget that this event is relative to been
     * reached?
     *
     * If false, then the {@link Root} should be searched until
     * {@link TabSelectEvent#relativeTo} is reached, then, set this to true. If
     * true, then the next visited widget that has a {@link Widget#tabFocusable}
     * value of true will be focused.
     *
     * Note that if {@link TabSelectEvent#relativeTo} is null, then this will be
     * true by default.
     */
    reachedRelative: boolean;

    constructor(relativeTo: Widget | null, reversed: boolean) {
        super(reversed);

        this.type = TabSelectEvent.type;
        this.focusType = null;
        this.needsFocus = false;
        this.userCapturable = true;
        this.relativeTo = relativeTo;
        this.reachedRelative = relativeTo === null;
    }

    cloneWithTarget(target: Widget | null): TabSelectEvent {
        super.warnUntargetable(target);
        const event = new TabSelectEvent(this.relativeTo, this.reversed);
        event.reachedRelative = this.reachedRelative;
        return event;
    }
}
