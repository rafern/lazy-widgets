import type { Widget } from '../widgets/Widget';
import { ModifierEvent } from './ModifierEvent';
import { FocusType } from '../core/FocusType';

/**
 * A pointer {@link Event}.
 *
 * Has a focus type decided by the child classes and does not need focus.
 *
 * @category Event
 */
export abstract class PointerEvent extends ModifierEvent {
    /** Pointer event position's X coordinate in pixels. Not an integer. */
    readonly x: number;
    /** Pointer event position's Y coordinate in pixels. Not an integer. */
    readonly y: number;

    /** Create a new PointerEvent. */
    constructor(x: number, y: number, shift: boolean, ctrl: boolean, alt: boolean, target: Widget | null = null, focusType: FocusType | null = null) {
        super(shift, ctrl, alt, target, focusType, false);
        this.x = x;
        this.y = y;
    }

    /**
     * Create a new PointerEvent event with the same properties as this, except
     * with new {@link PointerEvent#x} and {@link PointerEvent#y} values
     * corrected for a given offset.
     */
    abstract correctOffset(xOffset: number, yOffset: number): PointerEvent;
}
