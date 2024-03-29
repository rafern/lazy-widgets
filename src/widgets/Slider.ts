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
import type { Viewport } from '../core/Viewport.js';
import type { Bounds } from '../helpers/Bounds.js';
import type { Root } from '../core/Root.js';
import type { Rect } from '../helpers/Rect.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { type Box } from '../state/Box.js';

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

    /** The slider's minimum value. */
    private minValue: number;
    /** The slider's maximum value. */
    private maxValue: number;
    /**
     * The increments in which the slider changes value. If 0, there are no
     * fixed increments.
     */
    private snapIncrement: number;
    /** The helper for handling pointer clicks/drags */
    protected clickHelper: ClickHelper;
    /** Is this a vertical slider? */
    protected readonly vertical: boolean;
    /** The horizontal offset of the slider */
    private offsetX = 0;
    /** The vertical offset of the slider */
    private offsetY = 0;
    /** The actual width of the slider */
    private actualWidth = 0;
    /** The actual height of the slider */
    private actualHeight = 0;
    /** Is the keyboard focusing this widget? */
    @damageField
    private keyboardFocused = false;
    /** The helper for keeping track of the slider value */
    readonly variable: Box<number>;
    /** The callback used for the {@link Slider#"variable"} */
    private readonly callback: () => void;
    /**
     * The rectangle of the slider when the dragging started. Used to prevent
     * glitchy behaviour when the slider is being used while the layout is
     * changing. For internal use only.
     */
    private dragBounds: Bounds = [0, 0, 0, 0];

    constructor(variable: Box<number> = new Variable(0), minValue = 0, maxValue = 1, properties?: Readonly<SliderProperties>) {
        // Sliders need a clear background, have no children and don't propagate
        // events
        super(properties);

        if(maxValue < minValue) {
            throw new Error(DynMsg.SWAPPED_MIN_MAX(minValue, maxValue));
        }
        if(!isFinite(minValue) || isNaN(minValue)) {
            throw new Error(DynMsg.INVALID_MIN(minValue));
        }
        if(!isFinite(maxValue) || isNaN(maxValue)) {
            throw new Error(DynMsg.INVALID_MAX(maxValue));
        }

        const snapIncrement = properties?.snapIncrement ?? 0;
        if(!isFinite(snapIncrement) || isNaN(snapIncrement)) {
            throw new Error(DynMsg.INVALID_INC(maxValue));
        }
        if(snapIncrement < 0) {
            throw new Error(DynMsg.NEGATIVE_INC(maxValue));
        }

        this.clickHelper = new ClickHelper(this);
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.snapIncrement = snapIncrement;
        this.vertical = properties?.vertical ?? false;
        this.tabFocusable = true;
        this.variable = variable;
        this.callback = this.handleChange.bind(this);
    }

    protected handleChange(): void {
        this.markWholeAsDirty();
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

    /** The slider's value */
    set value(value: number) {
        this.setValue(value);
    }

    get value(): number {
        return this.variable.value;
    }

    /** Clamp a value to this slider's min and max values */
    protected clamp(value: number): number {
        if(value < this.minValue) {
            value = this.minValue;
        } else if(value > this.maxValue) {
            value = this.maxValue;
        }

        return value;
    }

    /** Set the slider's value, optionally using an observer group */
    setValue(value: number, group?: unknown): void {
        // Snap to increments if needed
        if(this.snapIncrement > 0) {
            value = Math.round(value / this.snapIncrement) * this.snapIncrement;
        }

        // Update value in variable
        this.variable.setValue(this.clamp(value), group);
    }

    protected stepValue(add: boolean, incMul: number): void {
        // Get snap increment. If the increment is not set, default to 1% of the
        // value range
        let effectiveIncrement = this.snapIncrement;
        if(effectiveIncrement === 0) {
            effectiveIncrement = 0.01 * (this.maxValue - this.minValue);
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
            this.dragBounds = [ x, x + this.actualWidth, y, y + this.actualHeight ];
        }

        // Handle click event
        this.clickHelper.handleClickEvent(event, this.root, this.dragBounds);

        // If this was a click or the slider is currently being held, update
        // value
        if(((this.clickHelper.clickStateChanged && this.clickHelper.wasClick) || this.clickHelper.clickState === ClickState.Hold)
            && this.clickHelper.pointerPos !== null) {
            // Interpolate value
            const percent = this.clickHelper.pointerPos[0];
            this.value = this.minValue + percent * (this.maxValue - this.minValue);
        }

        // Always flag as dirty if the click state changed (so glow colour takes
        // effect)
        if(this.clickHelper.clickStateChanged) {
            this.markWholeAsDirty();
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

        // Draw filled part of slider. Use accent colour if hovering or holding
        const ctx = this.viewport.context;
        const useGlow = this.keyboardFocused || this.clickHelper.clickState === ClickState.Hover || this.clickHelper.clickState === ClickState.Hold;
        if(useGlow) {
            ctx.fillStyle = this.accentFill;
        } else {
            ctx.fillStyle = this.primaryFill;
        }
        const fullWidth = this.actualWidth * Math.max(0, Math.min(1, (this.value - this.minValue) / (this.maxValue - this.minValue)));
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

    protected override handlePreLayoutUpdate() {
        super.handlePreLayoutUpdate();
        this.clickHelper.doneProcessing();
    }
}
