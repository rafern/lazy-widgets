import type { Widget } from '../widgets/Widget';
import { TricklingEvent } from './TricklingEvent';

/** A {@link TricklingEvent} which can be targeted. */
export abstract class TargetableTricklingEvent extends TricklingEvent {
    override readonly target: Widget | null;

    constructor(target: Widget | null, reversed = false) {
        super(reversed);

        this.target = target;
    }
}
