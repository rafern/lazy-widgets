import { TricklingEvent } from './TricklingEvent.js';

import type { Widget } from '../widgets/Widget.js';

/**
 * Marks a class as having warned the user that the event is untergetable in the
 * case that the event is cloned with a target set.
 */
const targetWarned = new Set<string>();

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

    constructor(reversed = false) {
        super(reversed);

        this.target = null;
    }

    protected warnUntargetable(target: Widget | null): void {
        if(target !== null && !targetWarned.has(this.type)) {
            targetWarned.add(this.type);
            console.warn(`"${this.type}" events cannot be targeted to a specific Widget. Target ignored`);
        }
    }
}
