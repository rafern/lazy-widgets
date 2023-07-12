import { PointerEvent } from './PointerEvent.js';
import type { Widget } from '../widgets/Widget.js';
import type { SourcePointer } from '../drivers/SourcePointer.js';
/**
 * A {@link PointerEvent} for button presses/releases, containing helpers for
 * checking whether it was the left/primary button, right/secondary button or
 * middle/tertiary button. Always take the button ID into account when handling
 * this event as you get a pair of {@link PointerPressEvent} and
 * {@link PointerReleaseEvent} events per button ID.
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

    constructor(x: number, y: number, button: number, shift: boolean, ctrl: boolean, alt: boolean, source: SourcePointer | null, target: Widget | null = null) {
        super(x, y, shift, ctrl, alt, source, target);

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
