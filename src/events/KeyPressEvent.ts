import { Widget } from '../widgets/Widget.js';
import { KeyEvent } from './KeyEvent.js';

/**
 * A key press {@link KeyEvent} (key down). Also dispatched on key repeats.
 *
 * @category Event
 */
export class KeyPressEvent extends KeyEvent {
    static override readonly type = 'key-press';
    override readonly type: typeof KeyPressEvent.type;

    constructor(key: string, shift: boolean, ctrl: boolean, alt: boolean, virtual: boolean, target: Widget | null) {
        super(key, shift, ctrl, alt, virtual, target);

        this.type = KeyPressEvent.type;
    }

    cloneWithTarget(target: Widget | null): KeyPressEvent {
        return new KeyPressEvent(this.key, this.shift, this.ctrl, this.alt, this.virtual, target);
    }
}
