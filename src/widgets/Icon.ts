import { damageField, layoutField, damageLayoutArrayField } from '../decorators/FlagFields.js';
import { Widget, WidgetProperties } from './Widget.js';
import { DynMsg, Msg } from '../core/Strings.js';
import type { Rect } from '../helpers/Rect.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { BackingMediaSource, getBackingMediaSourceType, urlToBackingMediaSource } from '../helpers/BackingMediaSource.js';
import { type AsyncImageBitmap } from '../helpers/AsyncImageBitmap.js';
import { type Padding } from '../theme/Padding.js';
import { BackingMediaSourceType } from '../helpers/BackingMediaSourceType.js';

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
    private _media: BackingMediaSource | null;
    /** The current media type (image, video, etc...). */
    private _mediaType: BackingMediaSourceType;
    /**
     * The last source that the current image was using. Used for tracking if
     * the image source changed and if the image is fully loaded. Only used if
     * the media is an HTMLImageElement.
     */
    private lastSrc: string | null = null;
    /** The last presentation hash if using an AsyncImageBitmap. */
    private lastPHash = -1;
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
     * Listener for video loadedmetadata and canplay events. Saved so it can be
     * removed when needed.
     */
    private loadedmetadataListener: ((event: Event) => void) | null = null;
    /**
     * Listener for video canplay event. Saved so it can be removed when needed.
     */
    private canplayListener: ((event: Event) => void) | null = null;
    /**
     * Used for requestVideoFrameCallback. If null, then callback is being done
     * by marking the whole widget as dirty, which may be wasteful.
     */
    private frameCallback: ((now: DOMHighResTimeStamp, metadata: unknown /* VideoFrameMetadata */) => void) | null = null;
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
            [image, this._mediaType] = urlToBackingMediaSource(image);
        } else {
            this._mediaType = getBackingMediaSourceType(image);
        }

        this._media = image;
        this.rotation = properties?.rotation ?? 0;
        this.viewBox = properties?.viewBox ?? null;
        this.imageWidth = properties?.width ?? null;
        this.imageHeight = properties?.height ?? null;
        this.fit = properties?.fit ?? IconFit.Contain;
        this.mediaPadding = properties?.mediaPadding ?? { left: 0, right: 0, top: 0, bottom: 0 };
        this.setupVideoEvents();
    }

    /**
     * Setup event listeners for video. Has no effect if {@link Icon#image} is
     * not a video
     */
    private setupVideoEvents() {
        if(this._mediaType === BackingMediaSourceType.HTMLVideoElement) {
            const video = this._media as HTMLVideoElement;
            // Add event listeners
            // loadedmetadata is so that we resize the widget when we know the
            // video dimensions
            this.loadedmetadataListener = _event => this._layoutDirty = true;
            video.addEventListener('loadedmetadata', this.loadedmetadataListener);
            // canplay is so that the first video frame is always displayed
            this.canplayListener = _event => this.markWholeAsDirty();
            video.addEventListener('canplay', this.canplayListener);

            if('requestVideoFrameCallback' in video) {
                console.warn(Msg.VIDEO_API_AVAILABLE);

                const originalVideo = video;
                this.frameCallback = (_now, _metadata) => {
                    // Mark widget as dirty when there is a new frame so that it
                    // is painted
                    if(this._media === originalVideo && this.frameCallback !== null) {
                        this.markWholeAsDirty();
                        video.requestVideoFrameCallback(this.frameCallback);
                    }
                }

                video.requestVideoFrameCallback(this.frameCallback);
            }
        }
    }

    /**
     * The image or video used by this Icon.
     *
     * Sets {@link Icon#_media} if changed and sets {@link Icon#lastSrc} to null
     * to mark the image as loading so that flickers are minimised.
     *
     * If getting, returns {@link Icon#_media}.
     */
    set image(image: BackingMediaSource | null) {
        if(image !== this._media) {
            if(this._media instanceof HTMLVideoElement) {
                // Remove old event listeners in video. null checks aren't
                // needed, but adding them anyways so that typescript doesn't
                // complain
                if(this.loadedmetadataListener !== null) {
                    this._media.removeEventListener('loadedmetadata', this.loadedmetadataListener);
                }
                if(this.canplayListener !== null) {
                    this._media.removeEventListener('canplay', this.canplayListener);
                }
            }

            this._media = image;
            this._mediaType = getBackingMediaSourceType(image);
            this.lastPHash = -1;
            this.lastSrc = null;
            this.loadedmetadataListener = null;
            this.canplayListener = null;
            this.frameCallback = null;
            this.setupVideoEvents();
        }
    }

    get image(): BackingMediaSource | null {
        return this._media;
    }

    protected override handlePreLayoutUpdate(): void {
        // Icons only needs to be re-drawn if image changed, which is tracked by
        // the image setter, or if the source changed, but not if the icon isn't
        // loaded yet. If this is a playing video, icon only needs to be
        // re-drawn if video is playing
        if(this._mediaType === BackingMediaSourceType.HTMLVideoElement) {
            if(!(this._media as HTMLVideoElement).paused && this.frameCallback === null) {
                this.markWholeAsDirty();
            }
        } else if(this._mediaType === BackingMediaSourceType.HTMLImageElement) {
            const img = this._media as HTMLImageElement;
            const curSrc = img.src;
            if(curSrc !== this.lastSrc && img.complete) {
                this._layoutDirty = true;
                this.lastSrc = curSrc;
                this.markWholeAsDirty();
            }
        } else if (this._mediaType === BackingMediaSourceType.AsyncImageBitmap) {
            const aib = this._media as AsyncImageBitmap;
            if(aib.presentationHash !== this.lastPHash && aib.bitmap) {
                this._layoutDirty = true;
                this.markWholeAsDirty();
            }
        }
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
                switch(this._mediaType) {
                case BackingMediaSourceType.HTMLImageElement: {
                    const media = this._media as HTMLImageElement;
                    wantedWidth = media.naturalWidth;
                    // HACK firefox has a naturalWidth of 0 for some SVGs. note
                    //      that images will likely have a bad aspect ratio
                    if (wantedWidth === 0 && media.complete) {
                        wantedWidth = 150;
                    }
                }   break;
                case BackingMediaSourceType.HTMLVideoElement:
                    wantedWidth = (this._media as HTMLVideoElement).videoWidth;
                    break;
                case BackingMediaSourceType.SVGImageElement: {
                    const baseVal = (this._media as SVGImageElement).width.baseVal;
                    if (baseVal.unitType === SVGLength.SVG_LENGTHTYPE_PX) {
                        wantedWidth = baseVal.value;
                    } else {
                        baseVal.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);
                        wantedWidth = baseVal.valueInSpecifiedUnits;
                    }
                }   break;
                case BackingMediaSourceType.VideoFrame:
                    wantedWidth = (this._media as VideoFrame).codedWidth;
                    break;
                default:
                    wantedWidth = (this._media as Exclude<BackingMediaSource, HTMLImageElement | SVGImageElement | HTMLVideoElement | VideoFrame>).width;
                }
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
                switch(this._mediaType) {
                case BackingMediaSourceType.HTMLImageElement: {
                    const media = this._media as HTMLImageElement;
                    wantedHeight = media.naturalHeight;
                    // HACK firefox has a naturalHeight of 0 for some SVGs. note
                    //      that images will likely have a bad aspect ratio
                    if (wantedHeight === 0 && media.complete) {
                        wantedHeight = 150;
                    }
                }   break;
                case BackingMediaSourceType.HTMLVideoElement:
                    wantedHeight = (this._media as HTMLVideoElement).videoHeight;
                    break;
                case BackingMediaSourceType.SVGImageElement: {
                    const baseVal = (this._media as SVGImageElement).height.baseVal;
                    if (baseVal.unitType === SVGLength.SVG_LENGTHTYPE_PX) {
                        wantedHeight = baseVal.value;
                    } else {
                        baseVal.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);
                        wantedHeight = baseVal.valueInSpecifiedUnits;
                    }
                }   break;
                case BackingMediaSourceType.VideoFrame:
                    wantedHeight = (this._media as VideoFrame).codedHeight;
                    break;
                default:
                    wantedHeight = (this._media as Exclude<BackingMediaSource, HTMLImageElement | SVGImageElement | HTMLVideoElement | VideoFrame>).height;
                }
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
            if (this._media === null || (this._mediaType === BackingMediaSourceType.HTMLImageElement && !(this._media as HTMLImageElement).complete)) {
                // XXX fallback for no media or not-yet-loaded images
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
        let actualImage: CanvasImageSource | null;
        if (this._mediaType === BackingMediaSourceType.AsyncImageBitmap) {
            const aib = this._media as AsyncImageBitmap;
            const bitmap = aib.bitmap;
            if (!bitmap) {
                return;
            }

            actualImage = bitmap;
            this.lastPHash = aib.presentationHash;
        } else if(this._mediaType === BackingMediaSourceType.HTMLImageElement && !(this._media as HTMLImageElement).complete) {
            this.lastSrc = null;
            actualImage = null;
        } else {
            actualImage = this._media as CanvasImageSource | null;
        }

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
