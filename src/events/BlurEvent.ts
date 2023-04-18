import { StickyEvent } from './StickyEvent.js';

import type { FocusType } from '../core/FocusType.js';

/**
 * A sticky event that is fired when a {@link Widget} loses a specific
 * {@link FocusType | focus}. Not capturable by user listeners or the widget
 * receiving the event.
 *
 * Always check the focus type to avoid weird behaviour.
 */
export class BlurEvent extends StickyEvent {
    static override readonly type = 'blur';
    override readonly type: typeof BlurEvent.type;
    override readonly userCapturable: false;

    /** The gained focus type */
    readonly focusType: FocusType;

    constructor(focusType: FocusType) {
        super();

        this.type = BlurEvent.type;
        this.userCapturable = false;
        this.focusType = focusType;
    }
}
