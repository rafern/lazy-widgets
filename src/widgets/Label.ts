import { TextHelper, WrapMode } from '../helpers/TextHelper';
import { layoutField } from '../decorators/FlagFields';
import { Widget, WidgetProperties } from './Widget';
import type { Rect } from '../helpers/Rect';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

/**
 * Optional TextInput constructor properties.
 *
 * @category Widget
 */
export interface LabelProperties extends WidgetProperties {
    /** Sets {@link Label#wrapText}. */
    wrapText?: boolean,
}

/**
 * A widget which displays a line of text.
 *
 * @category Widget
 */
export class Label extends Widget {
    static override autoXML: WidgetAutoXML = {
        parameters: [
            {
                mode: 'value',
                name: 'text',
                validator: 'string',
                optional: true
            }
        ],
        hasOptions: true
    };

    /** The helper for measuring/painting text */
    protected textHelper: TextHelper;
    /**
     * Is text wrapping enabled? If not, text will clipped on overflow
     *
     * @decorator `@layoutField`
     */
    @layoutField
    wrapText: boolean;

    /**
     * @param text - The text of the label. Has the same behaviour as setting {@link Label#text}.
     */
    constructor(text = '', properties?: Readonly<LabelProperties>) {
        // Labels need a clear background, have no children and don't propagate
        // events
        super(false, properties);

        this.wrapText = properties?.wrapText ?? true;
        this.textHelper = new TextHelper();
        this.textHelper.wrapMode = this.wrapText ? WrapMode.Shrink : WrapMode.None;
        this.text = text;
    }

    /** The current text value. */
    set text(text: string) {
        this.textHelper.text = text;
    }

    get text(): string {
        return this.textHelper.text;
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null ||
           property === 'bodyTextFont' ||
           property === 'labelMinWidth' ||
           property === 'labelMinAscent' ||
           property === 'labelMinDescent') {
            this._layoutDirty = true;
            this.markWholeAsDirty();
        } else if(property === 'bodyTextFill') {
            this.markWholeAsDirty();
        }
    }

    protected override handlePreLayoutUpdate(): void {
        // Update text helper variables
        this.textHelper.font = this.bodyTextFont;
        this.textHelper.lineHeight = this.bodyTextHeight;
        this.textHelper.lineSpacing = this.bodyTextSpacing;
        this.textHelper.wrapMode = this.wrapText ? WrapMode.Shrink : WrapMode.None;
        this.textHelper.alignMode = this.bodyTextAlign;

        // Mark as dirty if text helper is dirty
        if(this.textHelper.dirty) {
            this.markWholeAsDirty();
            this._layoutDirty = true;
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        this.textHelper.maxWidth = maxWidth;
        if(this.textHelper.dirty) {
            this.markWholeAsDirty();
        }

        // extra spacing is added so that there is enough height to center the
        // text
        this.idealWidth = Math.max(Math.min(this.textHelper.width, maxWidth), minWidth);
        this.idealHeight = Math.max(Math.min(this.textHelper.height + this.textHelper.actualLineSpacing, maxHeight), minHeight);
    }

    protected override handlePainting(_dirtyRects: Array<Rect>): void {
        // Start clipping if text wrapping is disabled or the text vertically
        // overflows
        const spacedHeight = this.textHelper.height + this.textHelper.actualLineSpacing;
        const needsClip = !this.wrapText || spacedHeight > this.idealHeight;
        const ctx = this.viewport.context;

        if(needsClip) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.clip();
        }

        // Paint text, vertically centered
        const yOffset = (this.idealHeight - this.textHelper.height + this.textHelper.actualLineSpacing) / 2;
        this.textHelper.paint(ctx, this.bodyTextFill, this.idealX, this.idealY + yOffset);

        // Stop clipping if clipping was applied
        if(needsClip) {
            ctx.restore();
        }
    }
}
