import { TargetableTricklingEvent } from './TargetableTricklingEvent';

import type { Widget } from '../widgets/Widget';

/**
 * An event which contains the state of modifier keys. This is an abstract class
 * and must be implemented in child classes.
 *
 * @category Event
 */
export abstract class ModifierEvent extends TargetableTricklingEvent {
    override readonly userCapturable: true;

    /** Is shift being pressed? */
    readonly shift: boolean;
    /** Is control being pressed? */
    readonly ctrl: boolean;
    /** Is alt being pressed? */
    readonly alt: boolean;

    constructor(shift: boolean, ctrl: boolean, alt: boolean, target: Widget | null) {
        super(target);

        this.userCapturable = true;
        this.shift = shift;
        this.ctrl = ctrl;
        this.alt = alt;
    }
}
