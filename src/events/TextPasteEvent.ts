import type { Widget } from '../widgets/Widget';
import { FocusType } from '../core/FocusType';
import { TricklingEvent } from './TricklingEvent';

/**
 * An event which contains text pasted by the clipboard.
 *
 * Has a focus type of {@link FocusType.Keyboard} and does not need focus.
 *
 * @category Event
 */
export class TextPasteEvent extends TricklingEvent {
    /** The pasted text */
    readonly text: string;

    constructor(text: string, target: Widget | null = null) {
        super(target, FocusType.Keyboard, false);
        this.text = text;
    }

    cloneWithTarget(target: Widget | null): TextPasteEvent {
        return new TextPasteEvent(this.text, target);
    }
}
