import { FocusType } from '../core/FocusType.js';
import { PointerEvent } from './PointerEvent.js';
import { Widget } from '../widgets/Widget.js';
import type { SourcePointer } from '../drivers/SourcePointer.js';
/**
 * A pointer move {@link PointerEvent}.
 *
 * Has a focus type of {@link FocusType.Pointer} and does not need focus.
 *
 * @category Event
 */
export class PointerMoveEvent extends PointerEvent {
    static override readonly type = 'pointer-move';
    override readonly type: typeof PointerMoveEvent.type;
    override readonly focusType: FocusType.Pointer;

    constructor(x: number, y: number, shift: boolean, ctrl: boolean, alt: boolean, source: SourcePointer | null, target: Widget | null = null) {
        super(x, y, shift, ctrl, alt, source, target);

        this.type = PointerMoveEvent.type;
        this.focusType = FocusType.Pointer;
    }

    correctOffset(xOffset: number, yOffset: number): PointerMoveEvent {
        return new PointerMoveEvent(this.x - xOffset, this.y - yOffset, this.shift, this.ctrl, this.alt, this.source, this.target);
    }

    cloneWithTarget(target: Widget | null): PointerMoveEvent {
        return new PointerMoveEvent(this.x, this.y, this.shift, this.ctrl, this.alt, this.source, target);
    }
}
