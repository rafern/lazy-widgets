import { BubblingEvent } from './BubblingEvent';

/**
 * An event that is fired when specific widgets are clicked, such as the
 * {@link Button} widget.
 *
 * @category Event
 */
export class ClickEvent extends BubblingEvent {
    static override readonly type = 'click';
    override readonly type: typeof ClickEvent.type;
    override readonly userCapturable: true;

    constructor() {
        super();

        this.type = ClickEvent.type;
        this.userCapturable = true;
    }
}
