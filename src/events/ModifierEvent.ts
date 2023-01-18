import type { FocusType } from '../core/FocusType';
import type { Widget } from '../widgets/Widget';
import { Event } from './Event';

/**
 * An event which contains the state of modifier keys. This is an abstract class
 * and must be implemented in child classes.
 *
 * @category Event
 */
export abstract class ModifierEvent extends Event {
    /** Is shift being pressed? */
    readonly shift: boolean;
    /** Is control being pressed? */
    readonly ctrl: boolean;
    /** Is alt being pressed? */
    readonly alt: boolean;

    /** Create a new ModifierEvent. */
    constructor(shift: boolean, ctrl: boolean, alt: boolean, target: Widget | null, focusType: FocusType | null, needsFocus: boolean) {
        super(target, focusType, needsFocus);
        this.shift = shift;
        this.ctrl = ctrl;
        this.alt = alt;
    }
}