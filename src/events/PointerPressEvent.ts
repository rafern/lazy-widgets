import { PointerButtonEvent } from './PointerButtonEvent';
import { Widget } from '../widgets/Widget';

import type { SourcePointer } from '../drivers/SourcePointer';

/**
 * A pointer press {@link PointerButtonEvent} (pointer button down).
 *
 * Has no focus type and does not need focus.
 *
 * @category Event
 */
export class PointerPressEvent extends PointerButtonEvent {
    static override readonly type = 'pointer-press';
    override readonly type: typeof PointerPressEvent.type;
    override readonly focusType: null;

    constructor(x: number, y: number, button: number, shift: boolean, ctrl: boolean, alt: boolean, source: SourcePointer | null, target: Widget | null = null) {
        super(x, y, button, shift, ctrl, alt, source, target);

        this.type = PointerPressEvent.type;
        this.focusType = null;
    }

    correctOffset(xOffset: number, yOffset: number): PointerPressEvent {
        return new PointerPressEvent(this.x - xOffset, this.y - yOffset, this.button, this.shift, this.ctrl, this.alt, this.source, this.target);
    }

    cloneWithTarget(target: Widget | null): PointerPressEvent {
        return new PointerPressEvent(this.x, this.y, this.button, this.shift, this.ctrl, this.alt, this.source, target);
    }
}

