/**
 * Which event propagation model is an event type using?
 *
 * @category Event
 */
export enum PropagationModel {
    /**
     * This event is propagated down the UI tree, in depth-first order. The
     * event is handled at every iterated {@link Widget}.
     */
    Trickling,
    /**
     * This event is propagated down the UI tree. The event is handled at every
     * iterated {@link Widget}.
     */
    Bubbling,
    /**
     * This event is only handled at the origin of the event; it does not
     * propagate.
     */
    Sticky,
}

/**
 * An event fired to/from a {@link Widget} in a UI tree.
 *
 * @category Event
 */
export abstract class WidgetEvent {
    /**
     * The type of this event class. Each event type should be unique, and have
     * a unique class.
     *
     * Due to Typescript limitations, no compile error is thrown when this
     * static field is not set at a sub-class. Despite this, the type **must**
     * be set to a unique string value.
     */
    static readonly type: string;
    /**
     * The type of this event **instance**. Compare this against the static
     * {@link WidgetEvent."type"} in the class or a known string value.
     * Comparing this value and doing an `instanceof` check must be equivalent.
     */
    abstract readonly type: string;
    /**
     * Is this event capturable by user event handlers?
     *
     * Note that if the event does not propagate, capturing the event still has
     * an effect; events are handled in the order for which the handlers were
     * added, meaning that if a handler captures the event, the other handlers
     * won't be called.
     */
    abstract readonly userCapturable: boolean;
    /** Which event propagation model is this event type using? */
    abstract readonly propagation: PropagationModel;
}
