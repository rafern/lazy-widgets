import type { Widget } from '../widgets/Widget';
import { WidgetEvent, PropagationModel } from './WidgetEvent';

/**
 * A generic event that bubbles up a UI tree. This is an abstract class and must
 * be implemented in child classes.
 *
 * @category Event
 */
export abstract class BubblingEvent extends WidgetEvent {
    override readonly propagation: PropagationModel.Bubbling;

    constructor() {
        super();
        this.propagation = PropagationModel.Bubbling;
    }

    /**
     * Create a new BubblingEvent with the same properties as this, except with
     * a new given target.
     */
    abstract cloneWithTarget(target: Widget | null): BubblingEvent;
}
