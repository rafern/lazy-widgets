import { PointerPressEvent } from '../events/PointerPressEvent.js';
import { PointerEvent } from '../events/PointerEvent.js';
import { damageField } from '../decorators/FlagFields.js';
import { ClickHelper } from '../helpers/ClickHelper.js';
import { Widget, WidgetProperties } from './Widget.js';
import { ClickState } from '../helpers/ClickState.js';
import { KeyPressEvent } from '../events/KeyPressEvent.js';
import { FocusType } from '../core/FocusType.js';
import { KeyEvent } from '../events/KeyEvent.js';
import { Variable } from '../state/Variable.js';
import { DynMsg } from '../core/Strings.js';
import { LeaveEvent } from '../events/LeaveEvent.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { FocusEvent } from '../events/FocusEvent.js';
import { BlurEvent } from '../events/BlurEvent.js';
import type { Bounds } from '../helpers/Bounds.js';
import type { Rect } from '../helpers/Rect.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { type Box } from '../state/Box.js';
import { ClickHelperEventType } from '../helpers/ClickHelperEventType.js';

/**
 * Optional Slider constructor properties.
 *
 * @category Widget
 */
export interface SliderProperties extends WidgetProperties {
    /** Sets {@link Slider#snapIncrement}. */
    snapIncrement?: number,
    /** Sets {@link Slider#vertical}. */
    vertical?: boolean
}

// TODO move minValue and maxValue to SliderProperties
// TODO make vertical read-write instead of readonly
// TODO make this easier to extend/customise. it's currently very hard to, for
//      example, modify this class in a subclass to make it look like a material
//      UI slider

/**
 * A slider flexbox widget; can slide a numeric value from an inclusive minimum
 * value to an inclusive maximum value, with optional snapping along set
 * increments.
 *
 * Note that sliders can only be horizontal.
 *
 * @category Widget
 */
export class Slider extends Widget {
    static override autoXML: WidgetAutoXML = {
        name: 'slider',
        inputConfig: [
            {
                mode: 'value',
                name: 'variable',
                validator: 'box',
                optional: true
            },
            {
                mode: 'value',
                name: 'min-value',
                validator: 'number',
                optional: true
            },
            {
                mode: 'value',
                name: 'max-value',
                validator: 'number',
                optional: true
            }
        ]
    };

    /** See {@link Slider#minValue} */
    private _minValue = 0;
    /** See {@link Slider#maxValue} */
    private _maxValue = 1;
    /** See {@link Slider#snapIncrement} */
    private _snapIncrement = 0;
    /** The helper for handling pointer clicks/drags */
    protected clickHelper: ClickHelper;
    /** Is this a vertical slider? */
    protected readonly vertical: boolean;
    /** The horizontal offset of the slider */
    protected offsetX = 0;
    /** The vertical offset of the slider */
    protected offsetY = 0;
    /** The actual width of the slider */
    protected actualWidth = 0;
    /** The actual height of the slider */
    protected actualHeight = 0;
    /** Is the keyboard focusing this widget? */
    @damageField
    protected keyboardFocused = false;
    /** The helper for keeping track of the slider value */
    readonly variable: Box<number>;
    /** The callback used for the {@link Slider#"variable"} */
    private readonly callback: () => void;
    /**
     * The rectangle of the slider when the dragging started. Used to prevent
     * glitchy behaviour when the slider is being used while the layout is
     * changing. For internal use only.
     */
    protected readonly dragBounds: Bounds = [0, 0, 0, 0];

    constructor(variable: Box<number> = new Variable(0), minValue = 0, maxValue = 1, properties?: Readonly<SliderProperties>) {
        super(properties);

        this.clickHelper = new ClickHelper(this);
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.snapIncrement = properties?.snapIncrement ?? 0;
        this.vertical = properties?.vertical ?? false;
        this.tabFocusable = true;
        this.variable = variable;
        this.callback = this.handleChange.bind(this);
    }

    protected handleChange(): void {
        this.markWholeAsDirty();
    }

    protected handleSlide() {
        const pointerPos = this.clickHelper.pointerPos;
        if (!pointerPos) {
            return;
        }

        // Interpolate value
        const percent = this.vertical ? (1 - pointerPos[1]) : pointerPos[0];
        this.value = this._minValue + percent * (this._maxValue - this._minValue);
    }

    protected override handleAttachment(): void {
        this.variable.watch(this.callback);
    }

    protected override handleDetachment(): void {
        this.variable.unwatch(this.callback);
    }

    private readonly handleClickHelperEvent = (event: ClickHelperEventType) => {
        switch (event) {
        case ClickHelperEventType.Clicked:
            this.handleSlide();
            break;
        case ClickHelperEventType.StateChanged:
            this.markWholeAsDirty();
            break;
        }
    };

    protected override activate(): void {
        super.activate();
        this.clickHelper.reset();
        this.clickHelper.addEventListener(this.handleClickHelperEvent);
    }

    protected override deactivate(): void {
        this.clickHelper.removeEventListener(this.handleClickHelperEvent);
        super.deactivate();
    }

    /** The slider's value */
    set value(value: number) {
        this.setValue(value);
    }

    get value(): number {
        return this.variable.value;
    }

    /**
     * The slider's minimum value.
     *
     * Changing this does not cause the value to be clamped; clamping occurs on
     * value changes.
     */
    set minValue(minValue: number) {
        if (this._minValue === minValue) {
            return;
        }

        if(!isFinite(minValue) || isNaN(minValue)) {
            throw new Error(DynMsg.INVALID_MIN(minValue));
        }

        this._minValue = minValue;
        this.markWholeAsDirty();
    }

    get minValue(): number {
        return this._minValue;
    }

    /**
     * The slider's maximum value.
     *
     * Changing this does not cause the value to be clamped; clamping occurs on
     * value changes.
     */
    set maxValue(maxValue: number) {
        if (this._maxValue === maxValue) {
            return;
        }

        if(!isFinite(maxValue) || isNaN(maxValue)) {
            throw new Error(DynMsg.INVALID_MAX(maxValue));
        }

        this._maxValue = maxValue;
        this.markWholeAsDirty();
    }

    get maxValue(): number {
        return this._maxValue;
    }

    /**
     * The increments in which the slider changes value. If 0, there are no
     * fixed increments.
     *
     * Changing this does not cause the value to changed to match the increment;
     * rounding occurs on value changes.
     */
    set snapIncrement(snapIncrement: number) {
        if (this._snapIncrement === snapIncrement) {
            return;
        }

        if(!isFinite(snapIncrement) || isNaN(snapIncrement)) {
            throw new Error(DynMsg.INVALID_INC(snapIncrement));
        }
        if(snapIncrement < 0) {
            throw new Error(DynMsg.NEGATIVE_INC(snapIncrement));
        }

        this._snapIncrement = snapIncrement;
    }

    get snapIncrement(): number {
        return this._snapIncrement;
    }

    /** Clamp a value to this slider's min and max values */
    protected clamp(value: number): number {
        if(value < this._minValue) {
            value = this._minValue;
        } else if(value > this._maxValue) {
            value = this._maxValue;
        }

        return value;
    }

    /** Set the slider's value, optionally using an observer group */
    setValue(value: number, group?: unknown): void {
        // Snap to increments if needed
        if(this._snapIncrement > 0) {
            value = Math.round(value / this._snapIncrement) * this._snapIncrement;
        }

        // Update value in variable
        this.variable.setValue(this.clamp(value), group);
    }

    protected stepValue(add: boolean, incMul: number): void {
        // Get snap increment. If the increment is not set, default to 1% of the
        // value range
        let effectiveIncrement = this._snapIncrement;
        if(effectiveIncrement === 0) {
            effectiveIncrement = 0.01 * (this._maxValue - this._minValue);
        }

        // Multiply increment (for holding shift)
        effectiveIncrement *= incMul;

        // Step value in increment
        const delta = add ? 1 : -1;
        this.value = this.clamp((Math.round(this.value / effectiveIncrement) + delta) * effectiveIncrement);
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'sliderThickness' ||
           property === 'sliderMinLength') {
            this._layoutDirty = true;
            this.markWholeAsDirty();
        } else if(property === 'accentFill' ||
                property === 'primaryFill' ||
                property === 'backgroundFill') {
            this.markWholeAsDirty();
        }
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            if (event.isa(FocusEvent)) {
                if(event.focusType === FocusType.Keyboard) {
                    this.keyboardFocused = true;
                }

                return this;
            } else if (event.isa(BlurEvent)) {
                if(event.focusType === FocusType.Keyboard) {
                    this.keyboardFocused = false;
                }

                return this;
            } else {
                return super.handleEvent(event);
            }
        }

        // Ignore unhandled events
        if(!(event.isa(LeaveEvent) || event instanceof PointerEvent || event instanceof KeyEvent)) {
            return null;
        }

        // Ignore tab key presses so tab selection works, and escape so widget
        // unfocusing works
        if(event.isa(KeyPressEvent) && (event.key === 'Tab' || event.key === 'Escape')) {
            return null;
        }

        // Handle key presses
        if(event instanceof KeyEvent) {
            if(event.isa(KeyPressEvent)) {
                const incMul = event.shift ? 10 : 1;
                if(event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                    this.stepValue(false, incMul);
                } else if(event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                    this.stepValue(true, incMul);
                }
            }

            return this;
        }

        // Save slider bounds so that the slider doesn't glitch out if dragged
        // while the layout changes. To handle hovering properly, also update if
        // moving pointer, but drag hasn't been initiated
        if(event.isa(PointerPressEvent) || this.clickHelper.clickState !== ClickState.Hold) {
            const x = this.idealX + this.offsetX;
            const y = this.idealY + this.offsetY;
            this.dragBounds[0] = x;
            this.dragBounds[1] = x + this.actualWidth;
            this.dragBounds[2] = y;
            this.dragBounds[3] = y + this.actualHeight;
        }

        // Handle click event
        this.clickHelper.handleClickEvent(event, this.root, this.dragBounds);

        // If this was a click or the slider is currently being held, update
        // value
        if(this.clickHelper.clickState === ClickState.Hold && this.clickHelper.pointerPos !== null) {
            this.handleSlide();
        }

        return this;
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Get theme properties
        const thickness = this.sliderThickness;
        const minLength = this.sliderMinLength;

        // Fully expand along main axis if constrained and center along cross
        // axis
        if(this.vertical) {
            // Main axis
            if(maxHeight != Infinity) {
                this.idealHeight = maxHeight;
            } else {
                this.idealHeight = Math.max(minLength, minHeight);
            }

            // Cross axis
            this.idealWidth = Math.min(Math.max(thickness, minWidth), maxWidth);

        } else {
            // Main axis
            if(maxWidth != Infinity) {
                this.idealWidth = maxWidth;
            } else {
                this.idealWidth = Math.max(minLength, minWidth);
            }

            // Cross axis
            this.idealHeight = Math.min(Math.max(thickness, minHeight), maxHeight);
        }
    }

    override finalizeBounds() {
        super.finalizeBounds();

        // cache centered position and dimensions
        if(this.vertical) {
            this.actualWidth = Math.min(this.width, this.sliderThickness);
            this.actualHeight = this.height;
            this.offsetX = (this.width - this.actualWidth) / 2;
            this.offsetY = 0;
        } else {
            this.actualWidth = this.width;
            this.actualHeight = Math.min(this.height, this.sliderThickness);
            this.offsetX = 0;
            this.offsetY = (this.height - this.actualHeight) / 2;
        }
    }

    protected override handlePainting(_dirtyRects: Array<Rect>): void {
        // Correct position with offset
        const x = this.x + this.offsetX;
        const y = this.y + this.offsetY;

        // Setup style for filled part of slider. Use accent colour if hovering
        // or holding
        const ctx = this.viewport.context;
        const useGlow = this.keyboardFocused || this.clickHelper.clickState === ClickState.Hover || this.clickHelper.clickState === ClickState.Hold;
        if(useGlow) {
            ctx.fillStyle = this.accentFill;
        } else {
            ctx.fillStyle = this.primaryFill;
        }

        if (this.vertical) {
            // bottom-to-top
            // Draw full part of slider
            const fullHeight = this.actualHeight * Math.max(0, Math.min(1, (this.value - this._minValue) / (this._maxValue - this._minValue)));
            ctx.fillRect(x, y + this.actualHeight - fullHeight, this.actualWidth, fullHeight);

            // Draw empty part of slider
            const emptyHeight = this.actualHeight - fullHeight;
            if (emptyHeight > 0) {
                if(useGlow) {
                    ctx.fillStyle = this.backgroundGlowFill;
                } else {
                    ctx.fillStyle = this.backgroundFill;
                }

                ctx.fillRect(x, y, this.actualWidth, emptyHeight);
            }
        } else {
            // left-to-right
            // Draw full part of slider
            const fullWidth = this.actualWidth * Math.max(0, Math.min(1, (this.value - this._minValue) / (this._maxValue - this._minValue)));
            ctx.fillRect(x, y, fullWidth, this.actualHeight);

            // Draw empty part of slider
            const emptyWidth = this.actualWidth - fullWidth;
            if (emptyWidth > 0) {
                if(useGlow) {
                    ctx.fillStyle = this.backgroundGlowFill;
                } else {
                    ctx.fillStyle = this.backgroundFill;
                }

                ctx.fillRect(x + fullWidth, y, emptyWidth, this.actualHeight);
            }
        }
    }
}
