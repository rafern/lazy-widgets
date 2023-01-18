import type { Widget } from '../widgets/Widget';
import { PointerEvent } from './PointerEvent';
import { FocusType } from '../core/FocusType';

/**
 * A {@link PointerEvent} for button presses/releases, containing helpers for
 * checking whether it was the left/primary button, right/secondary button or
 * middle/tertiary button. Always take the button ID into account when handling
 * this event as you get a pair of {@link PointerPress} and
 * {@link PointerRelease} events per button ID.
 *
 * Has a focus type decided by the child classes and does not need focus.
 *
 * @category Event
 */
export abstract class PointerButtonEvent extends PointerEvent {
    /**
     * The ID of the button affected.
     *
     * 0: left/primary button.
     * 1: right/secondary button.
     * 2: middle/tertiary button.
     * etc...
     */
    readonly button: number;

    /** Create a new PointerButtonEvent. */
    constructor(x: number, y: number, button: number, shift: boolean, ctrl: boolean, alt: boolean, target: Widget | null = null, focusType: FocusType | null = null) {
        super(x, y, shift, ctrl, alt, target, focusType);
        this.button = button;
    }

    /** Is the button affected the left/primary button? */
    get isLeft(): boolean {
        return this.button === 0;
    }

    /** Alias for {@link PointerButtonEvent#isLeft} */
    get isPrimary(): boolean {
        return this.isLeft;
    }

    /** Is the button affected the right/secondary button? */
    get isRight(): boolean {
        return this.button === 1;
    }

    /** Alias for {@link PointerButtonEvent#isRight} */
    get isSecondary(): boolean {
        return this.isRight;
    }

    /** Is the button affected the middle/tertiary button? */
    get isMiddle(): boolean {
        return this.button === 2;
    }

    /** Alias for {@link PointerButtonEvent#isMiddle} */
    get isTertiary(): boolean {
        return this.isMiddle;
    }
}
