import { GenericClickHelper } from "./GenericClickHelper";
import { BaseClickHelper } from "./BaseClickHelper";
import { ClickState } from "./ClickState";

/**
 * A class that mixes multiple {@link GenericClickHelper} instances into one.
 * Useful if you want a widget to be both clickable by a pointer and by the
 * enter key
 *
 * @category Helper
 */
export class CompoundClickHelper implements BaseClickHelper {
    /** The {@link GenericClickHelper} instances being mixed */
    private clickHelpers: GenericClickHelper[];

    constructor(clickHelpers: GenericClickHelper[]) {
        this.clickHelpers = clickHelpers;
    }

    get lastClickState(): ClickState {
        let highestState = ClickState.Released;
        for(const clickHelper of this.clickHelpers) {
            if(clickHelper.lastClickState > highestState)
                highestState = clickHelper.lastClickState;
        }

        return highestState;
    }

    get clickState(): ClickState {
        let highestState = ClickState.Released;
        for(const clickHelper of this.clickHelpers) {
            if(clickHelper.clickState > highestState)
                highestState = clickHelper.clickState;
        }

        return highestState;
    }

    /**
     * See {@link BaseClickHelper#clickStateChanged}.
     *
     * Note that this does not check if the combined state has changed, it only
     * check if any of the states in {@link CompoundClickHelper#clickHelpers}
     * has changed, meaning that this can be true while
     * {@link CompoundClickHelper#clickState} is equal to
     * {@link CompoundClickHelper#lastClickState}. To check whether the combined
     * state changed, compare the aforementioned values. This is the default
     * behaviour so that clicks aren't dropped.
     */
    get clickStateChanged(): boolean {
        for(const clickHelper of this.clickHelpers) {
            if(clickHelper.clickStateChanged)
                return true;
        }

        return false;
    }

    /**
     * Similar to {@link BaseClickHelper#wasClick}, except that the wasClick
     * property for each click helper is only true if the
     * {@link BaseClickHelper#clickStateChanged} property is also true.
     */
    get wasClick(): boolean {
        for(const clickHelper of this.clickHelpers) {
            if(clickHelper.wasClick && clickHelper.clickStateChanged)
                return true;
        }

        return false;
    }

    /** Resets each click helper instance being mixed. */
    reset(): void {
        for(const clickHelper of this.clickHelpers)
            clickHelper.reset();
    }
}