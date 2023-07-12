import { TricklingEvent } from './TricklingEvent.js';
import type { Widget } from '../widgets/Widget.js';
/**
 * A {@link TricklingEvent} which cannot be targeted.
 *
 * @category Event
 */
export abstract class UntargetableTricklingEvent extends TricklingEvent {
    /**
     * The target of this event. Since this is an untargetable event, this will
     * always be null.
     */
    override readonly target: null;

    /**
     * Internal flag. Marks a class as having warned the user that the event is
     * untergetable in the case that the event is cloned with a target set.
     *
     * @internal
     */
    static __lw_internal_targetWarned: boolean;

    constructor(reversed = false) {
        super(reversed);

        this.target = null;
    }

    protected warnUntargetable(target: Widget | null): void {
        const subClass = (this.constructor as typeof UntargetableTricklingEvent);
        if(target !== null && !subClass.__lw_internal_targetWarned) {
            subClass.__lw_internal_targetWarned = true;
            console.warn(`"${subClass.type}" events cannot be targeted to a specific Widget. Target ignored`);
        }
    }
}

Object.defineProperty(
    UntargetableTricklingEvent,
    '__lw_internal_targetWarned',
    {
        enumerable: false,
        value: false
    }
);
