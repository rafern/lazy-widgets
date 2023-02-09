import type { Widget } from '../widgets/Widget';
import { ModifierEvent } from './ModifierEvent';
import { FocusType } from '../core/FocusType';
import type { SourcePointer } from '../drivers/SourcePointer';

/**
 * A pointer {@link TricklingEvent}.
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
    /**
     * The source of this event. If null, this is an anonymous source, such as
     * a virtual pointer. Not useful on its own, but is useful when passed along
     * in feedback events; for example, in a feedback event that is dispatched
     * whenever a button is hovered, the pointer event source could be used to
     * provide haptic feedback, since the user knows which "real" pointer source
     * each pointerID is mapped to.
     */
    readonly source: SourcePointer | null;

    constructor(x: number, y: number, shift: boolean, ctrl: boolean, alt: boolean, source: SourcePointer | null, target: Widget | null = null, focusType: FocusType | null = null) {
        super(shift, ctrl, alt, target, focusType, false);
        this.x = x;
        this.y = y;
        this.source = source;
    }

    /**
     * Create a new PointerEvent event with the same properties as this, except
     * with new {@link PointerEvent#x} and {@link PointerEvent#y} values
     * corrected for a given offset.
     */
    abstract correctOffset(xOffset: number, yOffset: number): PointerEvent;
}
