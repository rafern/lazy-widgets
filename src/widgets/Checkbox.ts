import { ButtonClickHelper } from '../helpers/ButtonClickHelper';
import { Widget, WidgetProperties } from './Widget';
import { ClickState } from '../helpers/ClickState';
import type { FocusType } from '../core/FocusType';
import type { Viewport } from '../core/Viewport';
import type { Event } from '../events/Event';
import { Variable } from '../state/Variable';
import type { Root } from '../core/Root';

/**
 * A checkbox widget; can be ticked or unticked.
 *
 * @category Widget
 */
export class Checkbox extends Widget {
    /** Horizontal offset. */
    private offsetX = 0;
    /** Vertical offset. */
    private offsetY = 0;
    /** Actual length after resolving layout. */
    private actualLength = 0;
    /** The helper used for handling pointer clicks and enter presses */
    protected clickHelper: ButtonClickHelper;
    /** The helper for keeping track of the checkbox value */
    readonly variable: Variable<boolean>;
    /** The callback used for the {@link Checkbox#"variable"} */
    private readonly callback: () => void;
    /** See {@link Checkbox#clickable} */
    private _clickable = true;

    /**
     * Create a new Checkbox.
     *
     * @param variable - The {@link Variable} where the value will be stored.
     */
    constructor(variable: Variable<boolean> = new Variable(false), properties?: Readonly<WidgetProperties>) {
        // Checkboxes need a clear background, have no children and don't
        // propagate events
        super(true, false, properties);

        this.tabFocusable = true;
        this.variable = variable;
        this.callback = this.handleChange.bind(this);
        this.clickHelper = new ButtonClickHelper(this);
    }

    protected handleChange(): void {
        this._dirty = true;
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

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null) {
            this._layoutDirty = true;
            this._dirty = true;
        }
        else if(property === 'checkboxLength') {
            this._layoutDirty = true;
            this._dirty = true;
        }
        else if(property === 'backgroundGlowFill' ||
                property === 'backgroundFill' ||
                property === 'accentFill' ||
                property === 'primaryFill' ||
                property === 'checkboxInnerPadding')
        {
            this._dirty = true;
        }
    }

    /** Is the checkbox checked? */
    set checked(checked: boolean) {
        this.variable.value = checked;
    }

    get checked(): boolean {
        return this.variable.value;
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
            this.clickable,
            [x, x + this.actualLength, y, y + this.actualLength]
        );

        // Swap value if checkbox was clicked
        if(wasClick)
            this.checked = !this.checked;

        // Always flag as dirty if the click state changed (so glow colour takes
        // effect). Toggle value if clicked
        if(this.clickHelper.clickStateChanged)
            this._dirty = true;

        return capture ? this : null;
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Resolve width and height
        const minLength = Math.min(this.checkboxLength, maxWidth, maxHeight);
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
        this.actualLength = Math.min(this.checkboxLength, this.width, this.height);
        this.offsetX = (this.width - this.actualLength) / 2;
        this.offsetY = (this.height - this.actualLength) / 2;
    }

    protected override handlePainting(_forced: boolean): void {
        // Should we use glow colours? (background glow and accent)
        const useGlow = this.clickHelper.clickState === ClickState.Hover ||
                        this.clickHelper.clickState === ClickState.Hold;

        // Draw unchecked part of checkbox
        const ctx = this.viewport.context;
        if(useGlow)
            ctx.fillStyle = this.backgroundGlowFill;
        else
            ctx.fillStyle = this.backgroundFill;

        const checkboxX = this.offsetX + this.x;
        const checkboxY = this.offsetY + this.y;
        ctx.fillRect(
            checkboxX, checkboxY, this.actualLength, this.actualLength,
        );

        // Draw checked part of checkbox
        if(this.checked) {
            if(useGlow)
                ctx.fillStyle = this.accentFill;
            else
                ctx.fillStyle = this.primaryFill;

            const innerPadding = this.checkboxInnerPadding;
            const innerLength = this.actualLength - innerPadding * 2;

            // Fall back to filling entire checkbox if there isn't enough space
            // for padding
            if(innerLength <= 0) {
                ctx.fillRect(
                    checkboxX,
                    checkboxY,
                    this.actualLength,
                    this.actualLength,
                );
            }
            else {
                ctx.fillRect(
                    checkboxX + innerPadding,
                    checkboxY + innerPadding,
                    innerLength,
                    innerLength,
                );
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
        this._dirty = true;
    }
}
