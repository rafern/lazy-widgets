import { FocusType} from '../core/FocusType';
import { Widget } from '../widgets/Widget';
import { TricklingEvent } from './TricklingEvent';

/**
 * A leave {@link TricklingEvent}. Dispatched when the pointer leaves the root
 * or the focus capturer changes to another widget.
 *
 * Has a focus type of {@link FocusType.Pointer} and needs focus.
 *
 * @category Event
 */
export class Leave extends TricklingEvent {
    constructor(target: Widget | null = null) {
        super(target, FocusType.Pointer, true);
    }

    cloneWithTarget(target: Widget | null): Leave {
        return new Leave(target);
    }
}
