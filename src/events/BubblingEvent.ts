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
}
