import type { WidgetEvent } from './WidgetEvent';

/**
 * An event listener. Handles an event from a {@link WidgetEventEmitter}. If the
 * listener returns true and the event is user-capturable, then the event is
 * captured. If false, or nothing, is returned, then the event is not captured.
 * If the event is not user-capturable, but true is returned anyway, the capture
 * will be ignored and a warning will be printed to the console once.
 */
export type WidgetEventListener = (event: WidgetEvent) => boolean | undefined;

/**
 * For implementers of the {@link WidgetEventEmitter} interface. A tuple
 * containing an ID, an event listener and a boolean which, if true, marks the
 * listener as only being called once.
 */
export type WidgetEventTypedListenerTuple = [id: number, listener: WidgetEventListener, callOnce: boolean];

/**
 * For implementers of the {@link WidgetEventEmitter} interface. A map which
 * maps an event type to a list of listeners.
 */
export type WidgetEventTypedListenerMap = Map<string, Array<WidgetEventTypedListenerTuple>>;

/**
 * For implementers of the {@link WidgetEventEmitter} interface. A pair
 * containing an ID and an event listener.
 */
export type WidgetEventUntypedListenerPair = [id: number, listener: WidgetEventListener];

/**
 * For implementers of the {@link WidgetEventEmitter} interface. A list of
 * listeners that listen to any event type.
 */
export type WidgetEventUntypedListenerList = Array<WidgetEventUntypedListenerPair>;

/**
 * An interface for UI classes that can emit events, such as a {@link Widget} or
 * a {@link Root}.
 */
export interface WidgetEventEmitter {
    /**
     * Add event listener for a specific event type.
     *
     * @param eventType - The event type to listen to. Any other event type will not invoke this listener callback.
     * @param listener - The listener/callback to invoke when the event is emitted.
     * @param once - Should the listener be removed after being invoked once? False by default.
     */
    on(eventType: string, listener: WidgetEventListener, once?: boolean): void;
    /**
     * Similar to {@link WidgetEventEmitter#on}, but listens to any event type.
     * Untyped event listeners have a lower priority than typed event listeners.
     * Does not support listening only once.
     *
     * @param listener - The listener/callback to invoke when an event is emitted.
     */
    onAny(listener: WidgetEventListener): void;
    /**
     * Remove a specific event listener for a specific type. Note that if the
     * same listener callback is reused only the first one is removed. The once
     * parameter must match for the listener to be removed.
     *
     * @param eventType - The event type that the listener is listening to.
     * @param listener - The listener/callback to remove.
     * @param once - Was the listener marked as a once-only event. False by default.
     * @returns Returns true if a listener was removed, false otherwise.
     */
    off(eventType: string, listener: WidgetEventListener, once?: boolean): boolean;
    /**
     * Remove a specific untyped event listener. Note that if the same listener
     * callback is reused only the first one is removed.
     *
     * @returns Returns true if a listener was removed, false otherwise.
     */
    offAny(listener: WidgetEventListener): boolean;
}
