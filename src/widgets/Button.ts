import { ButtonClickHelper } from '../helpers/ButtonClickHelper';
import { BaseContainer } from './BaseContainer';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent';
import { SingleParentAutoXML } from '../xml/SingleParentAutoXML';
import { ClickEvent } from '../events/ClickEvent';
import { FocusEvent } from '../events/FocusEvent';
import { BlurEvent } from '../events/BlurEvent';

import type { Widget } from './Widget';
import type { TricklingEvent } from '../events/TricklingEvent';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';

/**
 * A {@link BaseContainer} which can be {@link ClickHelper | clicked} as a
 * button. Since the button grabs all events, no events are propagated to the
 * child.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class Button<W extends Widget = Widget> extends BaseContainer<W> {
    static override autoXML = SingleParentAutoXML;

    /** The helper used for handling pointer clicks and enter presses */
    protected clickHelper: ButtonClickHelper;
    /** See {@link Button#clickable} */
    private _clickable: boolean;

    constructor(child: W, properties?: Readonly<ClickableWidgetProperties>) {
        super(child, properties);

        this._clickable = properties?.clickable ?? true;
        this.clickHelper = new ButtonClickHelper(this);
        this.tabFocusable = true;
    }

    /**
     * Click the button. If the button is {@link Button#clickable}, then a
     * {@link ClickEvent} will be fired.
     */
    click(): void {
        this.dispatchEvent(new ClickEvent(this));
    }

    protected override activate(): void {
        super.activate();
        this.clickHelper.reset();
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            if (event.isa(FocusEvent)) {
                this.clickHelper.onFocusGrabbed(event.focusType);
                return this;
            } else if (event.isa(BlurEvent)) {
                this.clickHelper.onFocusDropped(event.focusType);
                return this;
            } else {
                return super.handleEvent(event);
            }
        }

        const [wasClick, capture] = this.clickHelper.handleEvent(
            event as TricklingEvent, this.root, this._clickable, this.bounds
        );

        if(wasClick) {
            this.click();
        }

        return capture ? this : null;
    }

    /**
     * Is the button clickable? True by default. Used for disabling the button
     * without hiding it.
     */
    get clickable() {
        return this._clickable;
    }

    set clickable(clickable: boolean) {
        if(this._clickable === clickable) {
            return;
        }

        this._clickable = clickable;
        this.clickHelper.reset();
        this.markWholeAsDirty();
    }
}
