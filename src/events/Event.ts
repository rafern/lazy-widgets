import type { FocusType } from '../core/FocusType';
import type { Widget } from '../widgets/Widget';

/**
 * A generic event. This is an abstract class and must be implemented in child
 * classes.
 *
 * @category Event
 */
export abstract class Event {
    /** The target of this event. Can be null */
    readonly target: Widget | null;
    /**
     * The focus type of this event. Can be null.
     *
     * If null, this event cannot be focused, since events are focused by their
     * {@link FocusType} as a group.
     */
    readonly focusType: FocusType | null;
    /** Can this event be dispatched without a target? */
    readonly needsFocus: boolean;
    /** Is this event dispatched in reverse-order? */
    readonly reversed: boolean;

    /** Create a new Event. */
    constructor(target: Widget | null, focusType: FocusType | null, needsFocus: boolean, reversed = false) {
        this.target = target;
        this.focusType = focusType;
        this.needsFocus = needsFocus;
        this.reversed = reversed;
    }

    /**
     * Create a new Event with the same properties as this, except with a new
     * given target.
     */
    abstract cloneWithTarget(target: Widget | null): Event;
}