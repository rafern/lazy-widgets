import { type BaseClickHelper } from './BaseClickHelper.js';
import { CompoundClickHelper } from './CompoundClickHelper.js';

export class ComplementaryClickHelper extends CompoundClickHelper {
    constructor() {
        super([]);
    }

    /**
     * Add a ClickHelper to the list of complementing ClickHelpers. Note that
     * duplicates are allowed.
     *
     * The intended way of using this is to, for example, create a ClickHelper,
     * use it normally, and add it when the widget is attached
     * (handleAttachment), and do the opposite when the widget is detached
     * (handleDetachment).
     */
    addClickHelper(clickHelper: BaseClickHelper): void {
        this.clickHelpers.push(clickHelper);

        if (this.refs > 0) {
            clickHelper.addEventListener(this.handleDependentEvent);
        }
    }

    /**
     * Remove a ClickHelper from the list of complementing ClickHelpers.
     *
     * Depending on your use-case, you might also want to reset the ClickHelper
     * after removing it from this list.
     */
    removeClickHelper(clickHelper: BaseClickHelper): boolean {
        const idx = this.clickHelpers.indexOf(clickHelper);
        if (idx < 0) {
            return false;
        }

        if (this.refs > 0) {
            clickHelper.removeEventListener(this.handleDependentEvent);
        }

        this.clickHelpers.splice(idx, 1);
        return true;
    }
}
