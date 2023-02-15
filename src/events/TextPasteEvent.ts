import type { Widget } from '../widgets/Widget';
import { FocusType } from '../core/FocusType';
import { TargetableTricklingEvent } from './TargetableTricklingEvent';

/**
 * An event which contains text pasted by the clipboard.
 *
 * Has a focus type of {@link FocusType.Keyboard} and does not need focus.
 *
 * @category Event
 */
export class TextPasteEvent extends TargetableTricklingEvent {
    static override readonly type = 'text-paste';
    override readonly type: typeof TargetableTricklingEvent.type;
    override readonly focusType: FocusType.Keyboard;
    override readonly needsFocus: false;
    override readonly userCapturable: true;

    /** The pasted text */
    readonly text: string;

    constructor(text: string, target: Widget | null = null) {
        super(target);

        this.type = TextPasteEvent.type;
        this.focusType = FocusType.Keyboard;
        this.needsFocus = false;
        this.userCapturable = true;
        this.text = text;
    }

    cloneWithTarget(target: Widget | null): TextPasteEvent {
        return new TextPasteEvent(this.text, target);
    }
}
