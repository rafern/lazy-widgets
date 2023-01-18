import { paintField, layoutField, paintLayoutArrayField } from '../decorators/FlagFields';
import { Widget, WidgetProperties } from './Widget';
import { DynMsg, Msg } from '../core/Strings';
import type { Rect } from '../helpers/Rect';

const videoRegex = /^.*\.(webm|og[gv]|m(p4|4v|ov)|avi|qt)$/i;

/**
 * The image fitting mode for {@link Icon} widgets; describes how an image is
 * transformed if its dimensions don't match the output dimensions.
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
    fit?: IconFit
}

/**
 * A widget which displays a given image.
 *
 * @category Widget
 */
export class Icon extends Widget {
    /** The current image/video used by the icon. */
    private _image: HTMLImageElement | HTMLVideoElement;
    /**
     * The last source that the current image was using. Used for tracking if
     * the image source changed and if the image is fully loaded. Only used if
     * image is not a video.
     */
    private lastSrc: string | null = null;
    /**
     * The current image rotation in radians.
     *
     * @decorator `@paintField`
     */
    @paintField
    rotation = 0;
    /**
     * The view box of this Icon, useful if the image used for the icon is a
     * spritesheet. If null, the entire image will be used.
     *
     * @decorator `@paintLayoutArrayField(true)`
     */
    @paintLayoutArrayField(true)
    viewBox: Rect | null;
    /**
     * The wanted width. If null, the image's width will be used, taking
     * {@link Icon#viewBox} into account.
     *
     * @decorator `@layoutField`
     */
    @layoutField
    imageWidth: number | null = null;
    /**
     * The wanted height. If null, the image's height will be used, taking
     * {@link Icon#viewBox} into account.
     *
     * @decorator `@layoutField`
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
     * by setting _dirty to true every frame, which may be wasteful.
     */
    private frameCallback: ((now: DOMHighResTimeStamp, metadata: unknown /* VideoFrameMetadata */) => void) | null = null;
    /**
     * The {@link IconFit} mode to use when the image dimensions don't match the
     * widget dimensions.
     */
    @paintField
    fit: IconFit;

    /** Create a new Icon. */
    constructor(image: HTMLImageElement | HTMLVideoElement | string, properties?: Readonly<IconProperties>) {
        // Icons need a clear background, have no children and don't propagate
        // events
        super(true, false, properties);

        if(typeof image === 'string') {
            if(videoRegex.test(image)) {
                const videoElem = document.createElement('video');
                videoElem.src = image;
                // So that video poster shows. If you're passing your own video
                // element then this won't be automatically set
                videoElem.preload = 'auto';
                image = videoElem;
            }
            else {
                const imgElem = document.createElement('img');
                imgElem.src = image;
                image = imgElem;
            }
        }

        this._image = image;
        this.rotation = properties?.rotation ?? 0;
        this.viewBox = properties?.viewBox ?? null;
        this.imageWidth = properties?.width ?? null;
        this.imageHeight = properties?.height ?? null;
        this.fit = properties?.fit ?? IconFit.Contain;
        this.setupVideoEvents();
    }

    /**
     * Setup event listeners for video. Has no effect if {@link Icon#image} is
     * not a video
     */
    private setupVideoEvents() {
        if(this.image instanceof HTMLVideoElement) {
            // Add event listeners
            // loadedmetadata is so that we resize the widget when we know the
            // video dimensions
            this.loadedmetadataListener = _event => this._layoutDirty = true;
            this.image.addEventListener('loadedmetadata', this.loadedmetadataListener);
            // canplay is so that the first video frame is always displayed
            this.canplayListener = _event => this._dirty = true;
            this.image.addEventListener('canplay', this.canplayListener);

            if('requestVideoFrameCallback' in this.image) {
                console.warn(Msg.VIDEO_API_AVAILABLE);

                const originalVideo = this.image;
                this.frameCallback = (_now, _metadata) => {
                    // Set dirty flag when a new frame is got so that it is
                    // painted
                    this._dirty = true;

                    if(this.image === originalVideo && this.frameCallback !== null) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (this.image as any).requestVideoFrameCallback(this.frameCallback);
                    }
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this.image as any).requestVideoFrameCallback(this.frameCallback)
            }
        }
    }

    /**
     * The image or video used by this Icon.
     *
     * Sets {@link Icon#_image} if changed and sets {@link Icon#lastSrc} to null
     * to mark the image as loading so that flickers are minimised.
     *
     * If getting, returns {@link Icon#_image}.
     */
    set image(image: HTMLImageElement | HTMLVideoElement) {
        if(image !== this._image) {
            if(this._image instanceof HTMLVideoElement) {
                // Remove old event listeners in video. null checks aren't
                // needed, but adding them anyways so that typescript doesn't
                // complain
                if(this.loadedmetadataListener !== null)
                    this._image.removeEventListener('loadedmetadata', this.loadedmetadataListener);
                if(this.canplayListener !== null)
                    this._image.removeEventListener('canplay', this.canplayListener);
            }

            this._image = image;
            this.lastSrc = null;
            this.loadedmetadataListener = null;
            this.canplayListener = null;
            this.frameCallback = null;
            this.setupVideoEvents();
        }
    }

    get image(): HTMLImageElement | HTMLVideoElement {
        return this._image;
    }

    protected override handlePreLayoutUpdate(): void {
        // Icons only needs to be re-drawn if image changed, which is tracked by
        // the image setter, or if the source changed, but not if the icon isn't
        // loaded yet. If this is a playing video, icon only needs to be
        // re-drawn if video is playing
        if(this._image instanceof HTMLVideoElement) {
            if(!this._image.paused && this.frameCallback === null)
                this._dirty = true;
        }
        else if(this._image?.src !== this.lastSrc && this._image?.complete) {
            this._layoutDirty = true;
            this._dirty = true;
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Find dimensions
        let wantedWidth = this.imageWidth;
        if(wantedWidth === null) {
            if(this.viewBox === null) {
                if(this._image instanceof HTMLVideoElement)
                    wantedWidth = this._image.videoWidth;
                else
                    wantedWidth = this._image.naturalWidth;
            }
            else
                wantedWidth = this.viewBox[2];
        }

        this.idealWidth = Math.max(Math.min(wantedWidth, maxWidth), minWidth);

        let wantedHeight = this.imageHeight;
        if(wantedHeight === null) {
            if(this.viewBox === null) {
                if(this._image instanceof HTMLVideoElement)
                    wantedHeight = this._image.videoHeight;
                else
                    wantedHeight = this._image.naturalHeight;
            }
            else
                wantedHeight = this.viewBox[3];
        }

        this.idealHeight = Math.max(Math.min(wantedHeight, maxHeight), minHeight);

        // Find offset and actual image dimensions (preserving aspect ratio)
        switch(this.fit) {
            case IconFit.Contain:
            case IconFit.Cover:
            {
                const widthRatio = this.idealWidth / wantedWidth;
                const heightRatio = this.idealHeight / wantedHeight;
                let scale;

                if(this.fit === IconFit.Contain)
                    scale = Math.min(widthRatio, heightRatio);
                else
                    scale = Math.max(widthRatio, heightRatio);

                this.actualWidth = wantedWidth * scale;
                this.actualHeight = wantedHeight * scale;
                this.offsetX = (this.idealWidth - this.actualWidth) / 2;
                this.offsetY = (this.idealHeight - this.actualHeight) / 2;
                break;
            }
            case IconFit.Fill:
                this.actualWidth = this.idealWidth;
                this.actualHeight = this.idealHeight;
                this.offsetX = 0;
                this.offsetY = 0;
                break;
            default:
                throw new Error(DynMsg.INVALID_ENUM(this.fit, 'IconFit', 'fit'));
        }
    }

    protected override handlePainting(_forced: boolean): void {
        // Abort if icon isn't ready yet
        if(this._image instanceof HTMLImageElement && !this._image?.complete) {
            this.lastSrc = null;
            return;
        }

        // Mark as not needing to be drawn by setting the source
        this.lastSrc = this._image.src;

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
        if(this.viewBox === null) {
            ctx.drawImage(
                this._image,
                tdx, tdy, this.actualWidth, this.actualHeight,
            );
        }
        else {
            ctx.drawImage(
                this._image, ...this.viewBox,
                tdx, tdy, this.actualWidth, this.actualHeight,
            );
        }

        // Revert transformation
        if(needsClip)
            ctx.restore();
    }

    override dryPaint(): void {
        if(this._image instanceof HTMLImageElement && this._image?.complete)
            this.lastSrc = this._image.src;
        else
            this.lastSrc = null;

        super.dryPaint();
    }
}
