import type { WidgetEvent } from '../events/WidgetEvent';
import type { WidgetEventEmitter, WidgetEventListener, WidgetEventTypedListenerMap, WidgetEventUntypedListenerList } from '../events/WidgetEventEmitter';

/**
 * Helper function for implementing the {@link WidgetEventEmitter#on} method.
 *
 * @category Helper
 */
export function eventEmitterOn(nextID: number, typedListeners: WidgetEventTypedListenerMap, eventType: string, listener: WidgetEventListener, once: boolean): void {
    // get listener list for this type
    let listenerList = typedListeners.get(eventType);
    if (listenerList === undefined) {
        listenerList = [];
        typedListeners.set(eventType, listenerList);
    }

    // add to listener list
    listenerList.push([nextID, listener, once]);
}

/**
 * Helper function for implementing the {@link WidgetEventEmitter#onAny} method.
 *
 * @category Helper
 */
export function eventEmitterOnAny(nextID: number, untypedListeners: WidgetEventUntypedListenerList, listener: WidgetEventListener): void {
    untypedListeners.push([nextID, listener]);
}

/**
 * Helper function for implementing the {@link WidgetEventEmitter#off} method.
 *
 * @category Helper
 */
export function eventEmitterOff(typedListeners: WidgetEventTypedListenerMap, eventType: string, listener: WidgetEventListener, once: boolean): boolean {
    // get listener list for this type
    const listenerList = typedListeners.get(eventType);
    if (listenerList === undefined) {
        return false;
    }

    const listenerCount = listenerList.length;
    if (listenerCount === 0) {
        return false;
    }

    // remove matching listener
    for (let i = 0; i < listenerCount; i++) {
        const [_oID, oListener, oOnce] = listenerList[i];
        if (listener === oListener && once === oOnce) {
            listenerList.splice(i, 1);
            return true;
        }
    }

    return false;
}

/**
 * Helper function for implementing the {@link WidgetEventEmitter#offAny}
 * method.
 *
 * @category Helper
 */
export function eventEmitterOffAny(untypedListeners: WidgetEventUntypedListenerList, listener: WidgetEventListener): boolean {
    const listenerCount = untypedListeners.length;
    if (listenerCount === 0) {
        return false;
    }

    // remove matching listener
    let i = 0;
    for (; i < listenerCount; i++) {
        const [_oID, oListener] = untypedListeners[i];
        if (listener === oListener) {
            untypedListeners.splice(i, 1);
            return true;
        }
    }

    return false;
}

const invalidUserCaptures = new WeakSet();
function assertCapturable(captured: boolean | void, event: WidgetEvent): boolean {
    if (captured && !event.userCapturable) {
        if (!invalidUserCaptures.has(event.constructor)) {
            invalidUserCaptures.add(event.constructor);
            console.warn(`User event listener attempted to capture a non-user-capturable event (${event.constructor.name}). Capture ignored. This message will not be logged again`);
        }

        return true;
    }

    return false;
}

/**
 * Helper function for handling user events in a class that implements
 * {@link WidgetEventEmitter}.
 *
 * @returns Returns true if the user captured the event.
 * @category Helper
 */
export function eventEmitterHandleEvent(handler: WidgetEventEmitter, typedListenersMap: WidgetEventTypedListenerMap, untypedListeners: WidgetEventUntypedListenerList, event: WidgetEvent): boolean {
    // invoke typed handlers first, they have priority
    const typedListeners = typedListenersMap.get(event.type);
    if (typedListeners !== undefined) {
        // XXX do not cache typedListeners.length. a listener might be
        // added/removed on the user listener
        for (let i = 0; i < typedListeners.length;) {
            // call listener
            const [id, listener, remove] = typedListeners[i];
            let captured = listener(event, handler);

            if (assertCapturable(captured, event)) {
                captured = false;
            }

            // handle changes in index
            const tupleAfter = typedListeners[i];
            if (tupleAfter === undefined || tupleAfter[0] !== id) {
                // index of listener with wanted id has changed
                const count = typedListeners.length;
                if (captured) {
                    // captured, skip complicated fallback
                    if (remove) {
                        for (let j = 0; j < count; j++) {
                            if (typedListeners[j][0] === id) {
                                typedListeners.splice(j, 1);
                                break;
                            }
                        }
                    }
                } else {
                    // listener index moved, or removed, and event was not
                    // captured. change index to listener with ID after the one
                    // removed/moved
                    let found = null;
                    for (i = 0; i < count && typedListeners[i][0] <= id; i++) {
                        if (typedListeners[i][0] === id) {
                            found = i;
                        }
                    }

                    // remove listener
                    if (remove && found !== null) {
                        i--;
                        typedListeners.splice(found, 1);
                    }
                }
            } else {
                // remove listener if needed, or iterate to next index
                if (remove) {
                    typedListeners.splice(i, 1);
                } else {
                    i++;
                }
            }

            // captured, stop
            if (captured) {
                return true;
            }
        }
    }

    // invoke untyped handlers last
    for (let i = 0; i < untypedListeners.length;) {
        // call listener
        const [id, listener] = untypedListeners[i];
        let captured = listener(event, handler);

        if (assertCapturable(captured, event)) {
            captured = false;
        }

        // captured, stop
        if (captured) {
            return true;
        }

        // handles changes in index
        const tupleAfter = untypedListeners[i];
        if (tupleAfter === undefined || tupleAfter[0] !== id) {
            // listener index moved, or removed, and event was not
            // captured. change index to listener with ID after the one
            // removed/moved
            const count = untypedListeners.length;
            // eslint-disable-next-line no-empty
            for (i = 0; i < count && untypedListeners[i][0] <= id; i++) {}
        } else {
            // iterate to next index
            i++;
        }
    }

    // no user listener captured the event
    return false;
}
