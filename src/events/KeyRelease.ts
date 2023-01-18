import { Widget } from '../widgets/Widget';
import { KeyEvent } from './KeyEvent';

/**
 * A key release {@link KeyEvent} (key up).
 *
 * Has a focus type of {@link FocusType.Keyboard} and needs focus.
 *
 * @category Event
 */
export class KeyRelease extends KeyEvent {
    cloneWithTarget(target: Widget | null): KeyRelease {
        return new KeyRelease(this.key, this.shift, this.ctrl, this.alt, target);
    }
}
