import { damageField, layoutField, damageLayoutArrayField } from '../decorators/FlagFields.js';
import { Widget, WidgetProperties } from './Widget.js';
import { DynMsg } from '../core/Strings.js';
import type { Rect } from '../helpers/Rect.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { BackingMediaSource, urlToBackingMediaSource } from '../helpers/BackingMediaSource.js';
import { type Padding } from '../theme/Padding.js';
import { BackingMediaWrapper } from '../helpers/BackingMediaWrapper.js';
import { BackingMediaEventType } from '../helpers/BackingMediaEventType.js';

// TODO rename this to MediaFit
/**
 * The image fitting mode for {@link Icon} widgets; describes how an image is
 * transformed if its dimensions don't match the output dimensions.
 *
 * @category Widget
 */
export enum IconFit {
    /**
     * The image will be scaled down or up such that at least an axis of the
     * image has the same dimensions as the widget, and the entire image is
     * visible, preserving the aspect ratio of the image. The default image
     * fitting mode.
     */
    Contain,
    /**
     * Similar to {@link IconFit.Contain}, except parts of the image can be cut
     * off so that all parts of the widget are covered by the image.
     */
    Cover,
    /**
     * The image will be forced to have the same size as the widget by
     * stretching or squishing it.
     */
    Fill
}

// TODO rename this to MediaProperties
// TODO add a prefix to these properties. width and height are horribly generic
//      names that could be confused with actual widget dimensions
/**
 * Optional Icon constructor properties.
 *
 * @category Widget
 */
export interface IconProperties extends WidgetProperties {
    /** Sets {@link Icon#rotation}. */
    rotation?: number,
    /** Sets {@link Icon#viewBox}. */
    viewBox?: Rect | null,
    /** Sets {@link Icon#width}. */
    width?: number | null,
    /** Sets {@link Icon#height}. */
    height?: number | null,
    /** Sets {@link Icon#fit}. */
    fit?: IconFit,
    /** Sets {@link Icon#mediaPadding}. */
    mediaPadding?: Padding,
}

// TODO rename this to Media, and all related properties
/**
 * A widget which displays a given image.
 *
 * @category Widget
 */
export class Icon extends Widget {
    static override autoXML: WidgetAutoXML = {
        name: 'icon',
        inputConfig: [
            {
                mode: 'value',
                name: 'image',
                validator: 'nullable:image-source'
            }
        ]
    };

    /** The current media data used by the icon. */
    private _media: BackingMediaWrapper | null;
    /** Has the user already been warned about the broken media? */
    private warnedBroken = false;

    /** The current media rotation in radians. */
    @damageField
    rotation = 0;
    /**
     * The view box of this Icon, useful if the media used for the icon is a
     * spritesheet. If null, the entire media will be used.
     */
    @damageLayoutArrayField(true)
    viewBox: Rect | null;
    /**
     * The wanted width. If null, the media's width will be used, taking
     * {@link Icon#viewBox} into account.
     */
    @layoutField
    imageWidth: number | null = null;
    /**
     * The wanted height. If null, the media's height will be used, taking
     * {@link Icon#viewBox} into account.
     */
    @layoutField
    imageHeight: number | null = null;
    /** Horizontal offset. */
    private offsetX = 0;
    /** Vertical offset. */
    private offsetY = 0;
    /** Actual image width. */
    private actualWidth = 0;
    /** Actual image height. */
    private actualHeight = 0;
    /**
     * The {@link IconFit} mode to use when the media dimensions don't match the
     * widget dimensions.
     */
    @damageField
    fit: IconFit;
    /**
     * The {@link Padding} to add to the media.
     */
    @layoutField
    mediaPadding: Padding;

    constructor(image: BackingMediaSource | string | null, properties?: Readonly<IconProperties>) {
        super(properties);

        if(typeof image === 'string') {
            image = urlToBackingMediaSource(image)[0];
        }

        this._media = image === null ? null : new BackingMediaWrapper(image);
        this.rotation = properties?.rotation ?? 0;
        this.viewBox = properties?.viewBox ?? null;
        this.imageWidth = properties?.width ?? null;
        this.imageHeight = properties?.height ?? null;
        this.fit = properties?.fit ?? IconFit.Contain;
        this.mediaPadding = properties?.mediaPadding ?? { left: 0, right: 0, top: 0, bottom: 0 };
    }

    private readonly onMediaEvent = (ev: BackingMediaEventType) => {
        switch (ev) {
        case BackingMediaEventType.Dirty:
            this.markWholeAsDirty();
            break;
        case BackingMediaEventType.Resized:
            this._layoutDirty = true;
            break;
        }
    };

    protected override handleAttachment(): void {
        if (this._media) {
            this._media.addEventListener(this.onMediaEvent);
        }
    }

    protected override handleDetachment(): void {
        if (this._media) {
            this._media.removeEventListener(this.onMediaEvent);
        }
    }

    /**
     * The image or video used by this Icon. Sets {@link Icon#_media} if
     * changed.
     *
     * If getting, returns {@link Icon#_media}.
     */
    set image(image: BackingMediaSource | null) {
        if(image !== this._media) {
            if (this._media && this.attached) {
                this._media.removeEventListener(this.onMediaEvent);
            }

            this._media = image === null ? null : new BackingMediaWrapper(image);

            if (this._media && this.attached) {
                this._media.addEventListener(this.onMediaEvent);
            }
        }
    }

    get image(): BackingMediaSource | null {
        return this._media === null ? null : this._media.source;
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        const pad = this.mediaPadding;
        const hPad = pad.left + pad.right;
        const vPad = pad.top + pad.bottom;

        // Find dimensions
        let wantedWidth = this.imageWidth;
        if(wantedWidth === null) {
            if (this._media === null) {
                wantedWidth = 0;
            } else if (this.viewBox === null) {
                wantedWidth = this._media.width;
            } else {
                wantedWidth = this.viewBox[2];
            }
        }

        this.idealWidth = Math.max(Math.min(wantedWidth + hPad, maxWidth), minWidth);
        let idealWidthNoPad = Math.max(this.idealWidth - hPad, 0);

        let wantedHeight = this.imageHeight;
        if(wantedHeight === null) {
            if (this._media === null) {
                wantedHeight = 0;
            } else if (this.viewBox === null) {
                wantedHeight = this._media.height;
            } else {
                wantedHeight = this.viewBox[3];
            }
        }

        this.idealHeight = Math.max(Math.min(wantedHeight + vPad, maxHeight), minHeight);
        let idealHeightNoPad = Math.max(this.idealHeight - vPad, 0);

        // Find offset and actual image dimensions (preserving aspect ratio)
        switch(this.fit) {
        case IconFit.Contain:
        case IconFit.Cover:
        {
            if (this._media === null) {
                // XXX fallback for no media
                this.actualWidth = idealWidthNoPad;
                this.actualHeight = idealHeightNoPad;
            } else {
                const widthRatio = wantedWidth === 0 ? 0 : idealWidthNoPad / wantedWidth;
                const heightRatio = wantedHeight === 0 ? 0 : idealHeightNoPad / wantedHeight;

                let scale: number;
                if(this.fit === IconFit.Contain) {
                    scale = Math.min(widthRatio, heightRatio);
                } else {
                    scale = Math.max(widthRatio, heightRatio);
                }

                this.actualWidth = wantedWidth * scale;
                this.actualHeight = wantedHeight * scale;
            }

            if (this.fit === IconFit.Contain) {
                this.idealWidth = Math.max(Math.min(this.actualWidth + hPad, maxWidth), minWidth);
                this.idealHeight = Math.max(Math.min(this.actualHeight + vPad, maxHeight), minHeight);
                idealWidthNoPad = Math.max(this.idealWidth - hPad, 0);
                idealHeightNoPad = Math.max(this.idealHeight - vPad, 0);
            }

            this.offsetX = (idealWidthNoPad - this.actualWidth) / 2 + pad.left;
            this.offsetY = (idealHeightNoPad - this.actualHeight) / 2 + pad.top;
            break;
        }
        case IconFit.Fill:
            this.actualWidth = idealWidthNoPad;
            this.actualHeight = idealHeightNoPad;
            this.offsetX = pad.left;
            this.offsetY = pad.top;
            break;
        default:
            throw new Error(DynMsg.INVALID_ENUM(this.fit, 'IconFit', 'fit'));
        }
    }

    protected override handlePainting(_dirtyRects: Array<Rect>): void {
        let actualImage = this._media ? this._media.canvasImageSource : null;

        // Translate, rotate and clip if rotation is not 0
        let tdx = this.x + this.offsetX, tdy = this.y + this.offsetY;
        const rotated = this.rotation !== 0;
        const needsClip = rotated || this.fit === IconFit.Cover;
        const ctx = this.viewport.context;
        if(needsClip) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.clip();

            if(rotated) {
                ctx.translate(
                    this.x + this.offsetX + this.actualWidth / 2,
                    this.y + this.offsetY + this.actualHeight / 2,
                );
                tdx = -this.actualWidth / 2;
                tdy = -this.actualHeight / 2;
                ctx.rotate(this.rotation);
            }
        }

        // Draw image, with viewBox if it is not null
        if (actualImage) {
            try {
                if(this.viewBox === null) {
                    ctx.drawImage(
                        actualImage,
                        tdx, tdy, this.actualWidth, this.actualHeight,
                    );
                } else {
                    ctx.drawImage(
                        actualImage, ...this.viewBox,
                        tdx, tdy, this.actualWidth, this.actualHeight,
                    );
                }
            } catch(err) {
                // HACK even though complete is true, the image might be in a broken
                // state, which is not easy to detect. to prevent a crash, catch the
                // exception and log as a warning
                if (!this.warnedBroken) {
                    this.warnedBroken = true;
                    console.error(err);
                    console.warn("Failed to paint image to Icon widget. Are you using an invalid URL? This warning won't be shown again");
                }

                actualImage = null;
            }
        }

        // Draw fallback colour
        if (!actualImage) {
            const fill = this.mediaFallbackFill;
            if (fill !== 'transparent') {
                ctx.fillStyle = fill;
                ctx.fillRect(tdx, tdy, this.actualWidth, this.actualHeight);
            }
        }

        // Revert transformation
        if(needsClip) {
            ctx.restore();
        }
    }
}
