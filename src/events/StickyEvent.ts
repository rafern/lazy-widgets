import { WidgetEvent, PropagationModel } from './WidgetEvent';

/**
 * A generic event that does not propagate in a UI tree; it must be handled at
 * the dispatch origin of the event. This is an abstract class and must be
 * implemented in child classes.
 *
 * @category Event
 */
export abstract class StickyEvent extends WidgetEvent {
    override readonly propagation: PropagationModel.Sticky;

    constructor() {
        super();
        this.propagation = PropagationModel.Sticky;
    }
}
