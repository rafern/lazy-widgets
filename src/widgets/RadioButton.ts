import { ButtonClickHelper } from '../helpers/ButtonClickHelper';
import { Widget, WidgetProperties } from './Widget';
import { ClickState } from '../helpers/ClickState';
import type { FocusType } from '../core/FocusType';
import type { Variable } from '../state/Variable';
import type { Viewport } from '../core/Viewport';
import type { Event } from '../events/Event';
import type { Root } from '../core/Root';

/**
 * A radio button widget; used for selecting one of many options. Uses a shared
 * {@link Variable} instance and expects the creation of multiple RadioButton
 * instances.
 *
 * @typeParam V - The type stored in the {@link RadioButton#"variable"}; when a radio button is clicked, the value inside the variable has this type.
 *
 * @category Widget
 */
export class RadioButton<V> extends Widget {
    /** Horizontal offset. */
    private offsetX = 0;
    /** Vertical offset. */
    private offsetY = 0;
    /** Actual length after resolving layout. */
    private actualLength = 0;
    /** The helper used for handling pointer clicks and enter presses */
    protected clickHelper: ButtonClickHelper;
    /** The shared {@link Variable} where the value is set */
    readonly variable: Variable<V>;
    /**
     * The value that will be used when the {@link RadioButton#"variable"} is
     * set
     */
    protected value: V;
    /** The callback used for the {@link RadioButton#"variable"} */
    private readonly callback: () => void;
    /** Was the radio button selected in the last paint? */
    private _wasSelected = false;

    /**
     * Create a new radio button.
     *
     * @param variable - The shared variable that radio buttons will save the value to when selected.
     * @param value - The value that will be used to set the {@link RadioButton#"variable"} when the radio button is clicked
     */
    constructor(variable: Variable<V>, value: V, properties?: Readonly<WidgetProperties>) {
        // Radio buttons need a clear background, have no children and don't
        // propagate events
        super(true, false, properties);

        this.tabFocusable = true;
        this.variable = variable;
        this.value = value;
        this.clickHelper = new ButtonClickHelper(this);
        this.callback = this.handleChange.bind(this);
        this._wasSelected = this.selected;
    }

    protected handleChange(): void {
        if(this.selected !== this._wasSelected)
            this._dirty = true;
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null) {
            this._layoutDirty = true;
            this._dirty = true;
        }
        else if(property === 'radioButtonLength') {
            this._layoutDirty = true;
            this._dirty = true;
        }
        else if(property === 'backgroundGlowFill' ||
                property === 'backgroundFill' ||
                property === 'accentFill' ||
                property === 'primaryFill' ||
                property === 'radioButtonInnerPadding')
        {
            this._dirty = true;
        }
    }

    /**
     * Select this radio button. Sets the value in
     * {@link RadioButton#"variable"} to be {@link RadioButton#value}
     */
    select() {
        this.variable.value = this.value;
    }

    /**
     * Is the radio button selected? Equivalent to checking if the value in the
     * {@link RadioButton#"variable"} is strictly equal to the
     * {@link RadioButton#value}
     */
    get selected(): boolean {
        return this.variable.value === this.value;
    }

    override onFocusGrabbed(focusType: FocusType): void {
        if(this.clickHelper.onFocusGrabbed(focusType))
            this._dirty = true;
    }

    override onFocusDropped(focusType: FocusType): void {
        if(this.clickHelper.onFocusDropped(focusType))
            this._dirty = true;
    }

    protected override handleEvent(event: Event): this | null {
        const x = this.idealX + this.offsetX;
        const y = this.idealY + this.offsetY;
        const [wasClick, capture] = this.clickHelper.handleEvent(
            event,
            this.root,
            true,
            [x, x + this.actualLength, y, y + this.actualLength]
        );

        // Select radio button if button was clicked
        if(wasClick)
            this.select();

        // Always flag as dirty if the click state changed (so glow colour takes
        // effect). Toggle value if clicked
        if(this.clickHelper.clickStateChanged)
            this._dirty = true;

        return capture ? this : null;
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Resolve width and height
        const minLength = Math.min(this.radioButtonLength, maxWidth, maxHeight);
        this.idealWidth = minLength;
        this.idealHeight = minLength;

        if(this.idealWidth < minWidth)
            this.idealWidth = minWidth;
        if(this.idealHeight < minHeight)
            this.idealHeight = minHeight;
    }

    override finalizeBounds() {
        super.finalizeBounds();

        // Center checkbox
        this.actualLength = Math.min(this.radioButtonLength, this.width, this.height);
        this.offsetX = (this.width - this.actualLength) / 2;
        this.offsetY = (this.height - this.actualLength) / 2;
    }

    protected override handlePainting(_forced: boolean): void {
        this._wasSelected = this.selected;

        // Should we use glow colours? (background glow and accent)
        const useGlow = this.clickHelper.clickState === ClickState.Hover ||
                        this.clickHelper.clickState === ClickState.Hold;

        // Draw unchecked part of radio button
        const ctx = this.viewport.context;
        if(useGlow)
            ctx.fillStyle = this.backgroundGlowFill;
        else
            ctx.fillStyle = this.backgroundFill;

        const halfLength = this.actualLength / 2;
        const radioX = this.offsetX + this.x + halfLength;
        const radioY = this.offsetY + this.y + halfLength;
        this.paintCircle(radioX, radioY, halfLength);

        // Draw checked part of checkbox
        if(this.selected) {
            if(useGlow)
                ctx.fillStyle = this.accentFill;
            else
                ctx.fillStyle = this.primaryFill;

            const innerLength = this.actualLength - this.radioButtonInnerPadding * 2;

            // Fall back to filling entire radio button if there isn't enough
            // space for padding
            if(innerLength <= 0)
                this.paintCircle(radioX, radioY, halfLength);
            else {
                const halfInnerLength = innerLength / 2;
                this.paintCircle(radioX, radioY, halfInnerLength);
            }
        }
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        super.attach(root, viewport, parent);
        this.variable.watch(this.callback);
    }

    override detach(): void {
        super.detach();
        this.variable.unwatch(this.callback);
    }

    protected override activate(): void {
        super.activate();
        this.clickHelper.reset();
    }
}
