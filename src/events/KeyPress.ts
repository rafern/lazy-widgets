import { Widget } from '../widgets/Widget';
import { KeyEvent } from './KeyEvent';

/**
 * A key press {@link KeyEvent} (key down). Also dispatched on key repeats.
 *
 * Has a focus type of {@link FocusType.Keyboard} and needs focus.
 *
 * @category Event
 */
export class KeyPress extends KeyEvent {
    cloneWithTarget(target: Widget | null): KeyPress {
        return new KeyPress(this.key, this.shift, this.ctrl, this.alt, target);
    }
}
