import { ButtonClickHelper } from '../helpers/ButtonClickHelper';
import { Widget } from './Widget';
import { ClickState } from '../helpers/ClickState';
import { paintCircle } from '../helpers/paintCircle';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent';
import { FocusEvent } from '../events/FocusEvent';
import { BlurEvent } from '../events/BlurEvent';

import type { Variable } from '../state/Variable';
import type { Viewport } from '../core/Viewport';
import type { TricklingEvent } from '../events/TricklingEvent';
import type { Root } from '../core/Root';
import type { Rect } from '../helpers/Rect';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';

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
    static override autoXML: WidgetAutoXML = {
        name: 'radio-button',
        inputConfig: [
            {
                mode: 'value',
                name: 'variable',
                validator: 'variable'
            },
            {
                mode: 'value',
                name: 'value'
            }
        ]
    };

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
    /** See {@link RadioButton#clickable} */
    private _clickable: boolean;

    /**
     * @param variable - The shared variable that radio buttons will save the value to when selected.
     * @param value - The value that will be used to set the {@link RadioButton#"variable"} when the radio button is clicked
     */
    constructor(variable: Variable<V>, value: V, properties?: Readonly<ClickableWidgetProperties>) {
        // Radio buttons need a clear background, have no children and don't
        // propagate events
        super(properties);

        this._clickable = properties?.clickable ?? true;
        this.tabFocusable = true;
        this.variable = variable;
        this.value = value;
        this.clickHelper = new ButtonClickHelper(this);
        this.callback = this.handleChange.bind(this);
        this._wasSelected = this.selected;
    }

    protected handleChange(): void {
        if(this.selected !== this._wasSelected) {
            this.markWholeAsDirty();
        }
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'radioButtonLength') {
            this._layoutDirty = true;
            this.markWholeAsDirty();
        } else if(property === 'backgroundGlowFill' ||
                property === 'backgroundFill' ||
                property === 'accentFill' ||
                property === 'primaryFill' ||
                property === 'radioButtonInnerPadding') {
            this.markWholeAsDirty();
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

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            if (event.isa(FocusEvent)) {
                if (this.clickHelper.onFocusGrabbed(event.focusType)) {
                    this.markWholeAsDirty();
                }

                return this;
            } else if (event.isa(BlurEvent)) {
                if (this.clickHelper.onFocusDropped(event.focusType)) {
                    this.markWholeAsDirty();
                }

                return this;
            } else {
                return super.handleEvent(event);
            }
        }

        const x = this.idealX + this.offsetX;
        const y = this.idealY + this.offsetY;
        const [wasClick, capture] = this.clickHelper.handleEvent(
            event as TricklingEvent,
            this.root,
            this._clickable,
            [x, x + this.actualLength, y, y + this.actualLength]
        );

        // Select radio button if button was clicked
        if(wasClick) {
            this.select();
        }

        // Always mark as dirty if the click state changed (so glow colour takes
        // effect). Toggle value if clicked
        if(this.clickHelper.clickStateChanged) {
            this.markWholeAsDirty();
        }

        return capture ? this : null;
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Resolve width and height
        const minLength = Math.min(this.radioButtonLength, maxWidth, maxHeight);
        this.idealWidth = minLength;
        this.idealHeight = minLength;

        if(this.idealWidth < minWidth) {
            this.idealWidth = minWidth;
        }
        if(this.idealHeight < minHeight) {
            this.idealHeight = minHeight;
        }
    }

    override finalizeBounds() {
        super.finalizeBounds();

        // Center checkbox
        this.actualLength = Math.min(this.radioButtonLength, this.width, this.height);
        this.offsetX = (this.width - this.actualLength) / 2;
        this.offsetY = (this.height - this.actualLength) / 2;
    }

    protected override handlePainting(_dirtyRects: Array<Rect>): void {
        this._wasSelected = this.selected;

        // Should we use glow colours? (background glow and accent)
        const useGlow = this.clickHelper.clickState === ClickState.Hover ||
                        this.clickHelper.clickState === ClickState.Hold;

        // Draw unchecked part of radio button
        const ctx = this.viewport.context;
        if(useGlow) {
            ctx.fillStyle = this.backgroundGlowFill;
        } else {
            ctx.fillStyle = this.backgroundFill;
        }

        const halfLength = this.actualLength / 2;
        const radioX = this.offsetX + this.x + halfLength;
        const radioY = this.offsetY + this.y + halfLength;
        paintCircle(ctx, radioX, radioY, halfLength);

        // Draw checked part of checkbox
        if(this.selected) {
            if(useGlow) {
                ctx.fillStyle = this.accentFill;
            } else {
                ctx.fillStyle = this.primaryFill;
            }

            const innerLength = this.actualLength - this.radioButtonInnerPadding * 2;

            // Fall back to filling entire radio button if there isn't enough
            // space for padding
            if(innerLength <= 0) {
                paintCircle(ctx, radioX, radioY, halfLength);
            } else {
                const halfInnerLength = innerLength / 2;
                paintCircle(ctx, radioX, radioY, halfInnerLength);
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

    /**
     * Is the radio button clickable? True by default. Used for disabling the
     * radio button without hiding it.
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
