import { StickyEvent } from './StickyEvent';

import type { FocusType } from '../core/FocusType';

/**
 * A sticky event that is fired right before a {@link Widget} gains a specific
 * {@link FocusType | focus}. Not capturable by user listeners. If not captured
 * by the widget, the widget will not gain the focus.
 *
 * Always check the focus type to avoid weird behaviour.
 */
export class FocusEvent extends StickyEvent {
    static override readonly type = 'focus';
    override readonly type: typeof FocusEvent.type;
    override readonly userCapturable: false;

    /** The gained focus type */
    readonly focusType: FocusType;

    constructor(focusType: FocusType) {
        super();

        this.type = FocusEvent.type;
        this.userCapturable = false;
        this.focusType = focusType;
    }
}
