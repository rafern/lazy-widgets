import { Widget } from '../widgets/Widget.js';
import { KeyEvent } from './KeyEvent.js';

/**
 * A key release {@link KeyEvent} (key up).
 *
 * @category Event
 */
export class KeyReleaseEvent extends KeyEvent {
    static override readonly type = 'key-release';
    override readonly type: typeof KeyReleaseEvent.type;

    constructor(key: string, shift: boolean, ctrl: boolean, alt: boolean, virtual: boolean, target: Widget | null) {
        super(key, shift, ctrl, alt, virtual, target);

        this.type = KeyReleaseEvent.type;
    }

    cloneWithTarget(target: Widget | null): KeyReleaseEvent {
        return new KeyReleaseEvent(this.key, this.shift, this.ctrl, this.alt, this.virtual, target);
    }
}
