import type { Bounds } from '../helpers/Bounds';
import { Widget } from '../widgets/Widget';
import { UntargetableTricklingEvent } from './UntargetableTricklingEvent';

/**
 * An auto-scroll {@link UntargetableTricklingEvent}. Dispatched when a widget
 * (or part of a widget) wants to be visible to the user, such as the current
 * caret position when typing a character.
 *
 * This event is not static. As the event propagates in the UI tree, it will be
 * updated so that the wanted bounds are up-to-date.
 *
 * Note that this event is handled via {@link Widget#dispatchEvent} in a special
 * case; widgets will auto-capture the event if they are
 * {@link AutoScrollEvent#originallyRelativeTo}, and {@link Widget#handleEvent}
 * will only be called if {@link Widget#propagatesEvents} is true. The event
 * must be re-captured by scrollable containers if a child of those containers
 * captured the event, and {@link AutoScrollEvent#bounds} must be updated
 * accordingly. See {@link ScrollableViewportWidget#handleEvent} for an example
 * of this.
 *
 * @category Event
 */
export class AutoScrollEvent extends UntargetableTricklingEvent {
    static override readonly type = 'auto-scroll';
    override readonly type: typeof AutoScrollEvent.type;
    override readonly focusType: null;
    override readonly needsFocus: false;
    override readonly userCapturable: true;

    /**
     * The widget that the auto-scroll {@link AutoScrollEvent#bounds} will be
     * relative to.
     */
    readonly originallyRelativeTo: Widget;
    /**
     * The portion of {@link AutoScrollEvent#originallyRelativeTo} that needs to
     * be in view. For example, if a 5x10 rectangle at the top-left of the
     * widget needs to be selected, with a horizontal and vertical offset of 2,
     * then the bounds would be [2, 2, 7, 12].
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

    constructor(originallyRelativeTo: Widget, bounds: Bounds) {
        super();

        this.type = AutoScrollEvent.type;
        this.focusType = null;
        this.needsFocus = false;
        this.userCapturable = true;
        this.originallyRelativeTo = originallyRelativeTo;
        this.bounds = [...bounds];
    }

    cloneWithTarget(target: Widget | null): AutoScrollEvent {
        super.warnUntargetable(target);
        return new AutoScrollEvent(this.originallyRelativeTo, this.bounds);
    }
}
