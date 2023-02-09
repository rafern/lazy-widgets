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
export class PointerPress extends PointerButtonEvent {
    constructor(x: number, y: number, button: number, shift: boolean, ctrl: boolean, alt: boolean, source: SourcePointer | null, target: Widget | null = null) {
        super(x, y, button, shift, ctrl, alt, source, target);
    }

    correctOffset(xOffset: number, yOffset: number): PointerPress {
        return new PointerPress(this.x - xOffset, this.y - yOffset, this.button, this.shift, this.ctrl, this.alt, this.source, this.target);
    }

    cloneWithTarget(target: Widget | null): PointerPress {
        return new PointerPress(this.x, this.y, this.button, this.shift, this.ctrl, this.alt, this.source, target);
    }
}

