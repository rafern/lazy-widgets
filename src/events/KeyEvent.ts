import type { Widget } from '../widgets/Widget';
import { ModifierEvent } from './ModifierEvent';
import { FocusType } from '../core/FocusType';

/**
 * A keyboard {@link ModifierEvent}. This is an abstract class and is
 * implemented in the child classes {@link KeyPress} and {@link KeyRelease}.
 *
 * Has a focus type of {@link FocusType.Keyboard} and needs focus.
 *
 * @category Event
 */
export abstract class KeyEvent extends ModifierEvent {
    /**
     * This event's key. Uses the same values as the
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values | KeyboardEvent.key}
     * Web API.
     */
    readonly key: string;
    /**
     * Does this event original from a virtual keyboard? If true, then
     * {@link TabSelect} events will not be dispatched when a Tab key press is
     * not caught.
     */
    readonly virtual: boolean;

    constructor(key: string, shift: boolean, ctrl: boolean, alt: boolean, virtual: boolean, target: Widget | null) {
        super(shift, ctrl, alt, target, FocusType.Keyboard, true);
        this.key = key;
        this.virtual = virtual;
    }
}
