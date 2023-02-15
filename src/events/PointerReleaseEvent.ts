import { PointerButtonEvent } from './PointerButtonEvent';
import { FocusType } from '../core/FocusType';
import { Widget } from '../widgets/Widget';
import type { SourcePointer } from '../drivers/SourcePointer';

/**
 * A pointer release {@link PointerButtonEvent} (pointer button up).
 *
 * Has a focus type of {@link FocusType.Pointer} and does not need focus.
 *
 * @category Event
 */
export class PointerReleaseEvent extends PointerButtonEvent {
    static override readonly type = 'pointer-release';
    override readonly type: typeof PointerReleaseEvent.type;
    override readonly focusType: FocusType.Pointer;

    constructor(x: number, y: number, button: number, shift: boolean, ctrl: boolean, alt: boolean, source: SourcePointer | null, target: Widget | null = null) {
        super(x, y, button, shift, ctrl, alt, source, target);

        this.type = PointerReleaseEvent.type;
        this.focusType = FocusType.Pointer;
    }

    correctOffset(xOffset: number, yOffset: number): PointerReleaseEvent {
        return new PointerReleaseEvent(this.x - xOffset, this.y - yOffset, this.button, this.shift, this.ctrl, this.alt, this.source, this.target);
    }

    cloneWithTarget(target: Widget | null): PointerReleaseEvent {
        return new PointerReleaseEvent(this.x, this.y, this.button, this.shift, this.ctrl, this.alt, this.source, target);
    }
}
