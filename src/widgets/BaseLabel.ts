import { TextHelper, WrapMode } from '../helpers/TextHelper.js';
import { layoutField } from '../decorators/FlagFields.js';
import { Widget, WidgetProperties } from './Widget.js';
import type { Rect } from '../helpers/Rect.js';

/**
 * Optional TextInput constructor properties.
 *
 * @category Widget
 */
export interface LabelProperties extends WidgetProperties {
    /** Sets {@link Label#wrapMode}. */
    wrapMode?: WrapMode,
}

/**
 * Base class for {@link Label} and {@link LiveLabel}.
 *
 * @category Widget
 */
export abstract class BaseLabel extends Widget {
    /** The helper for measuring/painting text */
    protected textHelper: TextHelper;
    /**
     * Text wrapping mode. Used to control what happens when the text is too big
     * to fit in the label. Uses shrink-wrapping by default.
     */
    @layoutField
    wrapMode: WrapMode;

    constructor(properties?: Readonly<LabelProperties>) {
        super(properties);

        this.wrapMode = properties?.wrapMode ?? WrapMode.Shrink;
        this.textHelper = new TextHelper();
        this.textHelper.font = this.bodyTextFont;
        this.textHelper.lineHeight = this.bodyTextHeight;
        this.textHelper.lineSpacing = this.bodyTextSpacing;
        this.textHelper.wrapMode = this.wrapMode;
        this.textHelper.alignMode = this.bodyTextAlign;
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null) {
            this.textHelper.font = this.bodyTextFont;
            this.textHelper.lineHeight = this.bodyTextHeight;
            this.textHelper.lineSpacing = this.bodyTextSpacing;
            this.textHelper.wrapMode = this.wrapMode;
            this.textHelper.alignMode = this.bodyTextAlign;
            this._layoutDirty = true;
            this.markWholeAsDirty();
        } else if(property === 'bodyTextFill') {
            this.markWholeAsDirty();
        } else if(property === 'bodyTextFont') {
            this.textHelper.font = this.bodyTextFont;
        } else if(property === 'bodyTextHeight') {
            this.textHelper.lineHeight = this.bodyTextHeight;
        } else if(property === 'bodyTextSpacing') {
            this.textHelper.lineSpacing = this.bodyTextSpacing;
        } else if(property === 'wrapMode') {
            this.textHelper.wrapMode = this.wrapMode;
        } else if(property === 'bodyTextAlign') {
            this.textHelper.alignMode = this.bodyTextAlign;
        }
    }

    protected override handlePreLayoutUpdate(): void {
        // Mark as dirty if text helper is dirty
        if(this.textHelper.dirty) {
            this.markWholeAsDirty();
            this._layoutDirty = true;
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        const oldMaxWidth = this.textHelper.maxWidth;
        this.textHelper.maxWidth = maxWidth;

        this.idealWidth = Math.max(Math.min(this.textHelper.width, maxWidth), minWidth);
        this.idealHeight = Math.max(Math.min(this.textHelper.height, maxHeight), minHeight);

        if(this.textHelper.dirty) {
            this.textHelper.maxWidth = this.idealWidth;
            this.textHelper.cleanDirtyFlag();

            if (this.idealWidth !== oldMaxWidth) {
                this.markWholeAsDirty();
            }
        }
    }

    protected override handlePainting(_dirtyRects: Array<Rect>): void {
        // Start clipping if text wrapping is disabled or the text vertically
        // overflows
        const spacedHeight = this.textHelper.height + this.textHelper.actualLineSpacing;
        const needsClip = this.wrapMode === WrapMode.None || this.wrapMode === WrapMode.Ellipsis || spacedHeight > this.idealHeight;
        const ctx = this.viewport.context;

        if(needsClip) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.clip();
        }

        // Paint text, vertically centered
        const yOffset = (this.height - this.textHelper.height) / 2;
        this.textHelper.paint(ctx, this.bodyTextFill, this.x, this.y + yOffset);

        // Stop clipping if clipping was applied
        if(needsClip) {
            ctx.restore();
        }
    }
}
