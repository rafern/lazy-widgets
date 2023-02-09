import { FocusType} from '../core/FocusType';
import { Widget } from '../widgets/Widget';
import { Event } from './Event';

/**
 * A leave {@link Event}. Dispatched when the pointer leaves the root or the
 * focus capturer changes to another widget.
 *
 * Has a focus type of {@link FocusType.Pointer} and needs focus.
 *
 * @category Event
 */
export class Leave extends Event {
    constructor(target: Widget | null = null) {
        super(target, FocusType.Pointer, true);
    }

    cloneWithTarget(target: Widget | null): Leave {
        return new Leave(target);
    }
}
