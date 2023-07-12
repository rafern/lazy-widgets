import { WidgetEvent, PropagationModel } from './WidgetEvent.js';
import type { FocusType } from '../core/FocusType.js';
import type { Widget } from '../widgets/Widget.js';
/**
 * A generic event that trickles down a UI tree. This is an abstract class and
 * must be implemented in child classes.
 *
 * @category Event
 */
export abstract class TricklingEvent extends WidgetEvent {
    override readonly propagation: PropagationModel.Trickling;
    /** The target of this event. Can be null */
    abstract readonly target: Widget | null;
    /**
     * The focus type of this event. Can be null.
     *
     * If null, this event cannot be focused, since events are focused by their
     * {@link FocusType} as a group.
     */
    abstract readonly focusType: FocusType | null;
    /** Can this event be dispatched without a target? */
    abstract readonly needsFocus: boolean;
    /** Is this event dispatched in reverse-order? */
    readonly reversed: boolean;

    constructor(reversed = false) {
        super();

        this.reversed = reversed;
        this.propagation = PropagationModel.Trickling;
    }

    /**
     * Create a new TricklingEvent with the same properties as this, except with
     * a new given target.
     */
    abstract cloneWithTarget(target: Widget | null): TricklingEvent;
}
