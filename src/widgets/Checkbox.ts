import { ButtonClickHelper } from '../helpers/ButtonClickHelper.js';
import { Widget } from './Widget.js';
import { ClickState } from '../helpers/ClickState.js';
import { Variable } from '../state/Variable.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { FocusEvent } from '../events/FocusEvent.js';
import { BlurEvent } from '../events/BlurEvent.js';
import type { TricklingEvent } from '../events/TricklingEvent.js';
import type { Rect } from '../helpers/Rect.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import { type Box } from '../state/Box.js';

// HACK this prevents environments like Wonderland Engine from crashing when
//      bundling
let tickPath: Path2D | null = null;
function getTickPath() {
    if (!tickPath) {
        tickPath = new Path2D('M 0.1768 0.3339 L 0 0.5106 L 0.3846 0.8952 L 1 0.2798 L 0.8249 0.1048 L 0.3863 0.5434 z');
    }

    return tickPath;
}

/**
 * A checkbox widget; can be ticked or unticked.
 *
 * @category Widget
 */
export class Checkbox extends Widget {
    static override autoXML: WidgetAutoXML = {
        name: 'checkbox',
        inputConfig: [
            {
                mode: 'value',
                name: 'variable',
                validator: 'box',
                optional: true
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
    /** The helper for keeping track of the checkbox value */
    readonly variable: Box<boolean>;
    /** The callback used for the {@link Checkbox#"variable"} */
    private readonly callback: () => void;
    /** See {@link Checkbox#clickable} */
    private _clickable: boolean;

    /**
     * @param variable - The {@link Box} where the value will be stored.
     */
    constructor(variable: Box<boolean> = new Variable(false), properties?: Readonly<ClickableWidgetProperties>) {
        // Checkboxes need a clear background, have no children and don't
        // propagate events
        super(properties);

        this._clickable = properties?.clickable ?? true;
        this.tabFocusable = true;
        this.variable = variable;
        this.callback = this.handleChange.bind(this);
        this.clickHelper = new ButtonClickHelper(this);
    }

    protected handleChange(): void {
        this.markWholeAsDirty();
    }

    protected override handleAttachment(): void {
        this.variable.watch(this.callback);
    }

    protected override handleDetachment(): void {
        this.variable.unwatch(this.callback);
    }

    protected override activate(): void {
        super.activate();
        this.clickHelper.reset();
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'checkboxLength') {
            this._layoutDirty = true;
            this.markWholeAsDirty();
        } else if(property === 'backgroundGlowFill' ||
                property === 'backgroundFill' ||
                property === 'accentFill' ||
                property === 'primaryFill' ||
                property === 'checkboxInnerPadding') {
            this.markWholeAsDirty();
        }
    }

    /** Is the checkbox checked? */
    set checked(checked: boolean) {
        this.variable.value = checked;
    }

    get checked(): boolean {
        return this.variable.value;
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

        // Swap value if checkbox was clicked
        if(wasClick) {
            this.checked = !this.checked;
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
        const minLength = Math.min(this.checkboxLength, maxWidth, maxHeight);
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
        this.actualLength = Math.min(this.checkboxLength, this.width, this.height);
        this.offsetX = (this.width - this.actualLength) / 2;
        this.offsetY = (this.height - this.actualLength) / 2;
    }

    protected override handlePainting(_dirtyRects: Array<Rect>): void {
        // Should we use glow colours? (background glow and accent)
        const useGlow = this.clickHelper.clickState === ClickState.Hover ||
                        this.clickHelper.clickState === ClickState.Hold;

        // Draw background
        const ctx = this.viewport.context;
        const checkboxX = this.offsetX + this.x;
        const checkboxY = this.offsetY + this.y;
        ctx.fillStyle = useGlow ? this.backgroundGlowFill : this.backgroundFill;
        ctx.fillRect(
            checkboxX, checkboxY, this.actualLength, this.actualLength,
        );

        // Draw tick with filled square
        if(this.checked) {
            const innerPadding = this.checkboxInnerPadding;
            const innerLength = this.actualLength - innerPadding * 2;

            if(innerLength > 0) {
                ctx.fillStyle = useGlow ? this.accentFill : this.primaryFill;
                const cox = checkboxX + innerPadding;
                const coy = checkboxY + innerPadding;
                ctx.fillRect(cox, coy, innerLength, innerLength);

                ctx.save();
                ctx.fillStyle = useGlow ? this.backgroundGlowFill : this.backgroundFill;
                ctx.translate(cox, coy);
                ctx.scale(innerLength, innerLength);
                ctx.fill(getTickPath());
                ctx.restore();
            }
        }
    }

    /**
     * Is the checkbox clickable? True by default. Used for disabling the
     * checkbox without hiding it.
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

    protected override handlePreLayoutUpdate() {
        super.handlePreLayoutUpdate();
        this.clickHelper.doneProcessing();
    }
}
