import { ModifierEvent } from './ModifierEvent.js';
import { FocusType } from '../core/FocusType.js';
import type { Widget } from '../widgets/Widget.js';
/**
 * A keyboard {@link ModifierEvent}. This is an abstract class and is
 * implemented in the child classes {@link KeyPressEvent} and
 * {@link KeyReleaseEvent}.
 *
 * Has a focus type of {@link FocusType.Keyboard} and needs focus.
 *
 * @category Event
 */
export abstract class KeyEvent extends ModifierEvent {
    override readonly focusType: FocusType.Keyboard;
    override readonly needsFocus: true;

    /**
     * This event's key. Uses the same values as the
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values | KeyboardEvent.key}
     * Web API.
     */
    readonly key: string;
    /**
     * Does this event original from a virtual keyboard? If true, then
     * {@link TabSelectEvent} events will not be dispatched when a Tab key press
     * is not caught.
     */
    readonly virtual: boolean;

    constructor(key: string, shift: boolean, ctrl: boolean, alt: boolean, virtual: boolean, target: Widget | null) {
        super(shift, ctrl, alt, target);

        this.focusType = FocusType.Keyboard;
        this.needsFocus = true;
        this.key = key;
        this.virtual = virtual;
    }
}
