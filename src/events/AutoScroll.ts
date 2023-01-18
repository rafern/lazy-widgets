import type { Bounds } from '../helpers/Bounds';
import { Widget } from '../widgets/Widget';
import { DynMsg } from '../core/Strings';
import { Event } from './Event';

/**
 * An auto-scroll {@link Event}. Dispatched when a widget (or part of a widget)
 * wants to be visible to the user, such as the current caret position when
 * typing a character.
 *
 * This event is not static. As the event propagates in the UI tree, it will be
 * updated so that the wanted bounds are up-to-date.
 *
 * Note that this event is handled via {@link Widget#dispatchEvent} in a special
 * case; widgets will auto-capture the event if they are
 * {@link AutoScroll#originallyRelativeTo}, and {@link Widget#handleEvent} will
 * only be called if {@link Widget#propagatesEvents} is true. The event must be
 * re-captured by scrollable containers if a child of those containers captured
 * the event, and {@link AutoScroll#bounds} must be updated accordingly. See
 * {@link ScrollableViewportWidget#handleEvent} for an example of this.
 *
 * Has no focus type and does not need focus. Cannot be targetted.
 *
 * @category Event
 */
export class AutoScroll extends Event {
    /**
     * The widget that the auto-scroll {@link AutoScroll#bounds} will be
     * relative to.
     */
    readonly originallyRelativeTo: Widget;
    /**
     * The portion of {@link AutoScroll#originallyRelativeTo} that needs to be
     * in view. For example, if a 5x10 rectangle at the top-left of the widget
     * needs to be selected, with a horizontal and vertical offset of 2, then
     * the bounds would be [2, 2, 7, 12].
     *
     * Note that this is initially relative to originallyRelativeTo when the
     * event is created, but the bounds must be relative to the capturer instead
     * after the event is first captured.
     *
     * Can be changed by event handlers; typically it's changed to a scrollable
     * container after the container is scrolled so that there are no issues
     * with nested scrollable containers.
     */
    bounds: Bounds;

    /**  Create a new AutoScroll. */
    constructor(originallyRelativeTo: Widget, bounds: Bounds) {
        super(null, null, false);

        this.originallyRelativeTo = originallyRelativeTo;
        this.bounds = [...bounds];
    }

    cloneWithTarget(target: Widget | null): AutoScroll {
        if(target !== null && !AutoScroll.targetWarned) {
            AutoScroll.targetWarned = true;
            console.warn(DynMsg.UNTARGETABLE_EVENT('AutoScroll'));
        }

        const event = new AutoScroll(this.originallyRelativeTo, this.bounds);
        return event;
    }

    static targetWarned = false;
}