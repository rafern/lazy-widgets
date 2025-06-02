import { BaseClickHelper } from "./BaseClickHelper.js";
import { ClickHelperEventType } from "./ClickHelperEventType.js";
import { ClickState } from "./ClickState.js";

/**
 * A class that mixes multiple {@link BaseClickHelper} instances into one.
 * Useful if you want a widget to be both clickable by a pointer and by the
 * enter key
 *
 * @category Helper
 */
export class CompoundClickHelper extends BaseClickHelper {
    /** The {@link BaseClickHelper} instances being mixed */
    protected clickHelpers: BaseClickHelper[];
    private _clickState: ClickState = ClickState.Released;
    protected refs = 0;

    constructor(clickHelpers: BaseClickHelper[]) {
        super();
        this.clickHelpers = clickHelpers;
    }

    /**
     * Start listening to all ClickHelpers events. Must be called when a widget
     * that uses this CompoundClickHelper is attached to the UI tree
     * (handleAttachment).
     */
    ref() {
        if (this.refs++ > 0) {
            return;
        }

        this.updateClickState();

        for (const helper of this.clickHelpers) {
            helper.addEventListener(this.handleDependentEvent);
        }
    }

    /**
     * Stop listening to all ClickHelpers events. Must be called when a widget
     * that uses this CompoundClickHelper is detached from the UI tree
     * (handleDetachment).
     */
    unref() {
        if (this.refs === 0) {
            console.warn('CompoundClickHelper double-unreferenced');
            return;
        }

        if (--this.refs === 0) {
            for (const helper of this.clickHelpers) {
                helper.removeEventListener(this.handleDependentEvent);
            }
        }
    }

    private updateClickState() {
        let highestState = ClickState.Released;
        for(const clickHelper of this.clickHelpers) {
            if(clickHelper.clickState > highestState) {
                highestState = clickHelper.clickState;
            }
        }

        this._clickState = highestState;
    }

    protected readonly handleDependentEvent = (eventType: ClickHelperEventType) => {
        switch (eventType) {
        case ClickHelperEventType.Clicked:
            this.dispatchEvent(eventType);
            break;
        case ClickHelperEventType.StateChanged: {
            const oldState = this._clickState;
            this.updateClickState();
            if (oldState !== this._clickState) {
                this.dispatchEvent(eventType);
            }
        }   break;
        }
    }

    override get clickState(): ClickState {
        return this._clickState;
    }

    /** Resets each click helper instance being mixed. */
    override reset(): void {
        for(const clickHelper of this.clickHelpers) {
            clickHelper.reset();
        }
    }
}
