import { PointerWheel, PointerWheelMode } from '../events/PointerWheel';
import { PointerRelease } from '../events/PointerRelease';
import { PointerEvent } from '../events/PointerEvent';
import { PointerPress } from '../events/PointerPress';
import { PointerMove } from '../events/PointerMove';
import type { Widget } from '../widgets/Widget';
import { FocusType } from '../core/FocusType';
import type { Driver } from '../core/Driver';
import type { Event } from '../events/Event';
import { PointerHint } from './PointerHint';
import type { Root } from '../core/Root';
import { Leave } from '../events/Leave';

/**
 * A container which has the state associated with a specific {@link Root} for
 * use in a {@link PointerDriver}.
 *
 * @category Driver
 */
export interface PointerDriverState {
    eventQueue: Array<Event>;
    pointer: number | null;
    pressing: number;
    hovering: boolean;
    dragLast: [number, number] | null;
    dragOrigin: [number, number];
}

/**
 * A generic pointer {@link Driver | driver}.
 *
 * Does nothing on its own, but provides an API for sending pointer events to
 * registered roots and (un)registering pointers.
 *
 * @category Driver
 */
export class PointerDriver implements Driver {
    /**
     * The current state for each registered and enabled root. Contains whether
     * each root is pressing, hovering, which pointer is bound to it and its
     * event queue
     */
    protected states: Map<Root, PointerDriverState> = new Map();
    /**
     * The next available pointer ID. See {@link PointerDriver#registerPointer}
     */
    private nextPointerID = 0;
    /**
     * The {@link PointerHint | hints} for each pointer. The keys are pointer
     * IDs, while the values are that pointer's hint.
     *
     * See {@link PointerDriver#getPointerHint}
     */
    protected hints: Map<number, PointerHint> = new Map();
    /**
     * The dragToScroll value of every pointer ID. See
     * {@link PointerDriver#registerPointer}.
     */
    private dragToScroll: Map<number, boolean> = new Map();

    /** Unassign a pointer from a given root and its state. */
    private unassignPointer(root: Root, state: PointerDriverState) {
        // Clear pointer state
        if(state.pointer !== null)
            this.setPointerHint(state.pointer, PointerHint.None);

        // Clear state
        state.pointer = null;
        if(state.hovering) {
            // Queue up Leave event if hovering
            state.eventQueue.push(
                new Leave(root.getFocusCapturer(FocusType.Pointer))
            );
        }
        state.hovering = false;
        state.pressing = 0;
        state.dragLast = null;
    }

    /**
     * Register a new pointer.
     *
     * @param dragToScroll - If true, then dragging will result in PointerWheel events if no widget captures the events.
     * @returns Returns {@link PointerDriver#nextPointerID} and increments it
     */
    registerPointer(dragToScroll = false): number {
        const newID = this.nextPointerID++;
        this.setPointerHint(newID, PointerHint.None);
        this.dragToScroll.set(newID, dragToScroll);
        return newID;
    }

    /**
     * Unregister a pointer.
     *
     * If a root has this pointer bound to it, the pointer is unbound from the
     * root, a Leave event is queued to the root and the hovering and pressing
     * state of the root is set to false.
     */
    unregisterPointer(pointer: number): void {
        for(const [root, state] of this.states) {
            // Unassign pointer if unregistered pointer was assigned to root
            if(state.pointer === pointer)
                this.unassignPointer(root, state);
        }

        this.hints.delete(pointer);
        this.dragToScroll.delete(pointer);
    }

    /**
     * Check if a given pointer can queue an event to a given root. Also
     * automatically assigns pointer to root if possible. For internal use only.
     *
     * @param state - The root's state. Although the function could technically get the state itself, it's passed to avoid repetition since you will need the state yourself
     * @param givingActiveInput - Is the pointer giving active input (pressing button or scrolling)? If so, then it can auto-assign if the root is not being pressed by another pointer
     */
    private canQueueEvent(root: Root, pointer: number, state: PointerDriverState, givingActiveInput: boolean): boolean {
        // If there is no pointer assigned, assign this one
        const firstAssign = state.pointer === null;
        if(firstAssign)
            state.pointer = pointer;

        // If pointer is entering this root for the first time, then find which
        // root the pointer was assigned to and queue a leave event
        const pointerMatches = state.pointer === pointer;
        if(!pointerMatches || firstAssign) {
            for(const [otherRoot, otherState] of this.states) {
                // Ignore if its this root
                if(otherRoot === root)
                    continue;

                // If other root has this pointer assigned, unassign it
                if(otherState.pointer === pointer)
                    this.unassignPointer(otherRoot, otherState);
            }
        }

        // Ignore if pointer is not the assigned one and not giving active input
        // or being pressed by the assigned pointer
        if(!pointerMatches && (!givingActiveInput || state.pressing > 0))
            return false;
        else {
            // Replace assigned pointer and clear old assigned pointer's hint if
            // pointer changed and giving active input
            if(givingActiveInput && state.pointer !== pointer) {
                this.unassignPointer(root, state);
                state.pointer = pointer;
            }

            return true;
        }
    }

    /** Denormalise normalised pointer coordinates. Internal use only. */
    private denormaliseCoords(root: Root, xNorm: number, yNorm: number): [number, number] {
        const [width, height] = root.dimensions;
        return [xNorm * width, yNorm * height];
    }

    /**
     * Queue up a pointer event to a given root. The type of
     * {@link PointerEvent} is decided automatically based on the root's state
     * and whether its pressing or not.
     *
     * @param pointer - The registered pointer ID
     * @param xNorm - The normalised (non-integer range from 0 to 1) X coordinate of the pointer event. 0 is the left edge of the root, while 1 is the right edge of the root.
     * @param yNorm - The normalised (non-integer range from 0 to 1) Y coordinate of the pointer event. 0 is the top edge of the root, while 1 is the bottom edge of the root.
     * @param pressing - Is the pointer pressed? If null, then the last pressing state will be used. A bitmask where each set bit represents a different button being pressed
     * @param shift - Is shift being pressed?
     * @param ctrl - Is control being pressed?
     * @param alt - Is alt being pressed?
     *
     * If null, the last pressing state is used, meaning that the pressing state
     * has not changed. Useful if getting pointer movement in an event based
     * environment where you only know when a pointer press occurs, but not if
     * the pointer is pressed or not
     */
    movePointer(root: Root, pointer: number, xNorm: number, yNorm: number, pressing: number | null, shift: boolean, ctrl: boolean, alt: boolean): void {
        const state = this.states.get(root);
        if(typeof state === 'undefined')
            return;

        // If press state was not supplied, then it hasn't changed. Use the last
        // state
        if(pressing === null)
            pressing = state.pressing;

        // Abort if this pointer can't queue an event to the target root
        if(!this.canQueueEvent(root, pointer, state, pressing > 0))
            return;

        // Update state and queue up event
        state.hovering = true;
        const [x, y] = this.denormaliseCoords(root, xNorm, yNorm);
        if(pressing !== state.pressing) {
            // Get how many bits in the bitmask you need to check
            const bits = Math.floor(Math.log2(Math.max(pressing, state.pressing)));

            // Check which buttons changed and generate an event for each
            for(let bit = 0; bit <= bits; bit++) {
                const wasPressed = ((state.pressing >> bit) & 0x1) === 1;
                const isPressed = ((pressing >> bit) & 0x1) === 1;

                if(wasPressed === isPressed)
                    continue;

                if(isPressed)
                    state.eventQueue.push(new PointerPress(x, y, bit, shift, ctrl, alt));
                else
                    state.eventQueue.push(new PointerRelease(x, y, bit, shift, ctrl, alt));
            }

            state.pressing = pressing;
        }
        else
            state.eventQueue.push(new PointerMove(x, y, shift, ctrl, alt));

        // Update pointer's hint
        if(state.pressing > 0)
            this.setPointerHint(pointer, PointerHint.Pressing);
        else
            this.setPointerHint(pointer, PointerHint.Hovering);
    }

    /**
     * Queue up a {@link Leave} event to a given root. Event will only be queued
     * if the root was being hovered.
     *
     * @param pointer - The registered pointer ID
     */
    leavePointer(root: Root, pointer: number): void {
        const state = this.states.get(root);
        if(typeof state === 'undefined')
            return;

        // Queue leave event if this is the assigned pointer and if hovering
        if(state.hovering && state.pointer == pointer) {
            state.hovering = false;
            state.pressing = 0;
            state.dragLast = null;
            state.eventQueue.push(
                new Leave(root.getFocusCapturer(FocusType.Pointer))
            );
            this.setPointerHint(pointer, PointerHint.None);
        }
    }

    /**
     * Queue up a {@link Leave} event to any root with the given pointer
     * assigned. Event will only be queued if the root was being hovered.
     * Pointer will also be unassigned from root.
     *
     * @param pointer - The registered pointer ID
     */
    leaveAnyPointer(pointer: number): void {
        for(const root of this.states.keys())
            this.leavePointer(root, pointer);
    }

    /**
     * Queue up a mouse wheel event in a given 2D direction. Event will only be
     * queued if the root was being hovered.
     *
     * @param pointer - The registered pointer ID
     * @param xNorm - The normalised (non-integer range from 0 to 1) X coordinate of the pointer event. 0 is the left edge of the root, while 1 is the right edge of the root.
     * @param yNorm - The normalised (non-integer range from 0 to 1) Y coordinate of the pointer event. 0 is the top edge of the root, while 1 is the bottom edge of the root.
     * @param deltaX - How much was scrolled horizontally, in pixels
     * @param deltaY - How much was scrolled vertically, in pixels
     * @param deltaZ - How much was scrolled in the Z axis, in pixels. Rarely used
     * @param deltaMode - How the delta values should be interpreted
     * @param shift - Is shift being pressed?
     * @param ctrl - Is control being pressed?
     * @param alt - Is alt being pressed?
     */
    wheelPointer(root: Root, pointer: number, xNorm: number, yNorm: number, deltaX: number, deltaY: number, deltaZ: number, deltaMode: PointerWheelMode, shift: boolean, ctrl: boolean, alt: boolean): void {
        const state = this.states.get(root);
        if(typeof state === 'undefined')
            return;

        // Abort if this pointer can't queue an event to the target root
        if(!this.canQueueEvent(root, pointer, state, true))
            return;

        // Update state and queue up event
        state.hovering = true;
        const [x, y] = this.denormaliseCoords(root, xNorm, yNorm);
        state.eventQueue.push(new PointerWheel(x, y, deltaX, deltaY, deltaZ, deltaMode, false, shift, ctrl, alt));
    }

    /**
     * Set a pointer's {@link PointerHint | hint}.
     *
     * @param pointer - The registered pointer ID
     * @param hint - The new pointer hint
     * @returns Returns true if the pointer hint changed, else, false
     */
    protected setPointerHint(pointer: number, hint: PointerHint): boolean {
        const oldHint = this.hints.get(pointer);

        if(oldHint !== hint) {
            this.hints.set(pointer, hint);
            return true;
        }
        else
            return false;
    }

    /**
     * Get a pointer's {@link PointerHint | hint}.
     *
     * @param pointer - The registered pointer ID
     *
     * @returns Returns the given pointer ID's hint. If the pointer ID is not registered, {@link PointerHint.None} is returned.
     */
    getPointerHint(pointer: number): PointerHint {
        return this.hints.get(pointer) ?? PointerHint.None;
    }

    /**
     * Creates a state for the enabled root in {@link PointerDriver#states}.
     */
    onEnable(root: Root): void {
        // Create new state for UI that just got enabled
        this.states.set(root, <PointerDriverState>{
            eventQueue: [],
            pointer: null,
            pressing: 0,
            hovering: false,
            dragLast: null,
            dragOrigin: [0, 0],
        });
    }

    /**
     * Dispatches a leave event for the disabled root and deletes the state of
     * the disabled root from {@link PointerDriver#states}.
     */
    onDisable(root: Root): void {
        // Dispatch leave event
        root.dispatchEvent(new Leave());

        // Reset hint for assigned pointer and stop dragging
        const state = this.states.get(root);
        if(typeof state !== 'undefined' && state.pointer !== null) {
            this.setPointerHint(state.pointer, PointerHint.None);
            state.dragLast = null;
        }

        // Delete state for UI thats about to get disabled
        this.states.delete(root);
    }

    /**
     * Dispatches all queued events (found in {@link PointerDriver#states}) for
     * the root and clears its event queue
     */
    update(root: Root): void {
        const state = this.states.get(root);
        if(typeof state === 'undefined')
            return;

        // Check if drag to scroll is enabled for this root
        const dragToScroll = state.pointer === null
                                ? false
                                : this.dragToScroll.get(state.pointer);

        // Dispatch all queued events for this root
        for(const event of state.eventQueue) {
            // If this is a pointer event and pointer is dragging, continue
            // doing dragging logic
            if(event instanceof PointerEvent && state.dragLast !== null) {
                const [startX, startY] = state.dragLast;
                root.dispatchEvent(new PointerWheel(
                    ...state.dragOrigin,
                    startX - event.x, startY - event.y, 0,
                    PointerWheelMode.Pixel, false, false, false, true,
                ));

                if(event instanceof PointerRelease)
                    state.dragLast = null;
                else {
                    state.dragLast[0] = event.x;
                    state.dragLast[1] = event.y;
                }

                continue;
            }

            // Dispatch event. If nobody captures the event, dragToScroll is
            // enabled and this is a pointer press, then start dragging
            if(root.dispatchEvent(event))
                state.dragLast = null;
            else if(dragToScroll && event instanceof PointerPress) {
                state.dragLast = [event.x, event.y];
                state.dragOrigin[0] = event.x;
                state.dragOrigin[1] = event.y;
            }
        }

        // Clear queue
        state.eventQueue.length = 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onFocusChanged(_root: Root, _focusType: FocusType, _newFocus: Widget | null): void {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onFocusCapturerChanged(_root: Root, _focusType: FocusType, _oldCapturer: Widget | null, _newCapturer: Widget | null): void {}
}
