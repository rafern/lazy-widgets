import { Msg } from '../core/Strings.js';
import { type FastCanvasImageSource, type AsyncMedia } from './AsyncMedia.js';
import { BackingMediaEventType } from './BackingMediaEventType.js';
import { getBackingMediaSourceType, type BackingMediaSource } from './BackingMediaSource.js';
import { BackingMediaSourceType } from './BackingMediaSourceType.js';
import { incrementUint31 } from './incrementUint31.js';
import { type Listener, Notifier } from './Notifier.js';

// TODO move to a unified media source system, instead of using helper wrappers.
//      in the future, media won't even be in the main thread, so we can't use
//      BackingMediaSource directly in widgets

export class BackingMediaWrapper extends Notifier<BackingMediaEventType> {
    readonly sourceType: BackingMediaSourceType;
    private rvf = 0;
    private _presentationHash = 0;
    private videoLoaded = false;

    constructor(readonly source: BackingMediaSource) {
        super();
        this.sourceType = getBackingMediaSourceType(source);
    }

    private readonly dispatchResized = () => {
        this.dispatchEvent(BackingMediaEventType.Resized);
    };

    private readonly dispatchDirty = () => {
        this._presentationHash = incrementUint31(this._presentationHash);
        this.dispatchEvent(BackingMediaEventType.Dirty);
    };

    private readonly dispatchLoaded = () => {
        this.dispatchEvent(BackingMediaEventType.Loaded);
    };

    private readonly onImageLoaded = () => {
        this.dispatchResized();
        this.dispatchLoaded();
        this.dispatchDirty();
    };

    private readonly onReadyStateChanged = () => {
        const video = this.source as HTMLVideoElement;
        if (this.videoLoaded) {
            if (video.readyState < 2) {
                this.videoLoaded = false;
            }
        } else if (video.readyState >= 2) {
            this.videoLoaded = true;
            this.dispatchLoaded();
        }
    };

    private readonly dispatchDirtyAndRVF = () => {
        this.dispatchDirty();
        this.rvf = (this.source as HTMLVideoElement).requestVideoFrameCallback(this.dispatchDirtyAndRVF);
    };

    private readonly redirectEvents = (event: BackingMediaEventType) => {
        this.dispatchEvent(event);
    };

    private addSourceListeners() {
        switch (this.sourceType) {
        case BackingMediaSourceType.HTMLImageElement:
            // XXX need to assume that the image changed, because the source of
            //     the image is not guaranteed to remain the same
            this._presentationHash = incrementUint31(this._presentationHash);
            // falls through
        case BackingMediaSourceType.SVGImageElement:
            (this.source as HTMLImageElement | SVGImageElement).addEventListener('load', this.onImageLoaded);
            break;
        case BackingMediaSourceType.HTMLVideoElement:
            {
                const video = this.source as HTMLVideoElement;
                video.addEventListener('resize', this.dispatchResized);
                video.addEventListener('loadeddata', this.onReadyStateChanged);
                video.addEventListener('loadedmetadata', this.onReadyStateChanged);
                video.addEventListener('canplay', this.onReadyStateChanged);
                video.addEventListener('canplaythrough', this.onReadyStateChanged);
                video.addEventListener('waiting', this.onReadyStateChanged);
                this.onReadyStateChanged();

                if('requestVideoFrameCallback' in video) {
                    console.warn(Msg.VIDEO_API_AVAILABLE);
                    this.rvf = video.requestVideoFrameCallback(this.dispatchDirtyAndRVF);
                } else {
                    (video as HTMLVideoElement).addEventListener('timeupdate', this.dispatchDirty);
                }
            }
            break;
        case BackingMediaSourceType.AsyncMedia:
            (this.source as AsyncMedia).addEventListener(this.redirectEvents);
            break;
        }
    }

    private removeSourceListeners() {
        switch (this.sourceType) {
        case BackingMediaSourceType.HTMLImageElement:
        case BackingMediaSourceType.SVGImageElement:
            (this.source as HTMLImageElement | SVGImageElement).removeEventListener('load', this.onImageLoaded);
            break;
        case BackingMediaSourceType.HTMLVideoElement:
            {
                const video = this.source as HTMLVideoElement;
                video.removeEventListener('resize', this.dispatchResized);
                video.removeEventListener('loadeddata', this.onReadyStateChanged);
                video.removeEventListener('loadedmetadata', this.onReadyStateChanged);
                video.removeEventListener('canplay', this.onReadyStateChanged);
                video.removeEventListener('canplaythrough', this.onReadyStateChanged);
                video.removeEventListener('waiting', this.onReadyStateChanged);

                if('requestVideoFrameCallback' in video) {
                    video.cancelVideoFrameCallback(this.rvf);
                } else {
                    (video as HTMLVideoElement).removeEventListener('timeupdate', this.dispatchDirty);
                }
            }
            break;
        case BackingMediaSourceType.AsyncMedia:
            (this.source as AsyncMedia).removeEventListener(this.redirectEvents);
            break;
        }
    }

    override addEventListener(listener: Listener<BackingMediaEventType>): void {
        super.addEventListener(listener);

        if (this.listeners.size == 1) {
            this.addSourceListeners();
        }
    }

    override removeEventListener(listener: Listener<BackingMediaEventType>): boolean {
        const removed = super.removeEventListener(listener);

        if (removed && this.listeners.size == 0) {
            this.removeSourceListeners();
        }

        return removed;
    }

    get width() {
        switch(this.sourceType) {
        case BackingMediaSourceType.HTMLImageElement: {
            const source = this.source as HTMLImageElement;
            let width = source.naturalWidth;
            // HACK firefox has a naturalWidth of 0 for some SVGs. note
            //      that images will likely have a bad aspect ratio
            if (width === 0 && source.complete) {
                width = 150;
            }

            return width;
        }
        case BackingMediaSourceType.HTMLVideoElement:
            return (this.source as HTMLVideoElement).videoWidth;
        case BackingMediaSourceType.SVGImageElement: {
            const baseVal = (this.source as SVGImageElement).width.baseVal;
            if (baseVal.unitType === SVGLength.SVG_LENGTHTYPE_PX) {
                return baseVal.value;
            } else {
                baseVal.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);
                return baseVal.valueInSpecifiedUnits;
            }
        }
        case BackingMediaSourceType.VideoFrame:
            return (this.source as VideoFrame).codedWidth;
        default:
            return (this.source as Exclude<BackingMediaSource, HTMLImageElement | SVGImageElement | HTMLVideoElement | VideoFrame>).width;
        }
    }

    get height() {
        switch(this.sourceType) {
        case BackingMediaSourceType.HTMLImageElement: {
            const source = this.source as HTMLImageElement;
            let height = source.naturalHeight;
            // HACK firefox has a naturalHeight of 0 for some SVGs. note
            //      that images will likely have a bad aspect ratio
            if (height === 0 && source.complete) {
                height = 150;
            }

            return height;
        }
        case BackingMediaSourceType.HTMLVideoElement:
            return (this.source as HTMLVideoElement).videoHeight;
        case BackingMediaSourceType.SVGImageElement: {
            const baseVal = (this.source as SVGImageElement).height.baseVal;
            if (baseVal.unitType === SVGLength.SVG_LENGTHTYPE_PX) {
                return baseVal.value;
            } else {
                baseVal.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);
                return baseVal.valueInSpecifiedUnits;
            }
        }
        case BackingMediaSourceType.VideoFrame:
            return (this.source as VideoFrame).codedHeight;
        default:
            return (this.source as Exclude<BackingMediaSource, HTMLImageElement | SVGImageElement | HTMLVideoElement | VideoFrame>).height;
        }
    }

    get loaded() {
        switch(this.sourceType) {
        case BackingMediaSourceType.HTMLImageElement:
            return (this.source as HTMLImageElement).complete;
        case BackingMediaSourceType.HTMLVideoElement:
            return (this.source as HTMLVideoElement).readyState >= 2;
        case BackingMediaSourceType.SVGImageElement: {
            const baseVal = (this.source as SVGImageElement).height.baseVal;
            if (baseVal.unitType === SVGLength.SVG_LENGTHTYPE_PX) {
                return baseVal.value;
            } else {
                baseVal.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);
                return baseVal.valueInSpecifiedUnits;
            }
        }
        case BackingMediaSourceType.AsyncMedia:
            return !!(this.source as AsyncMedia).currentFrame;
        default:
            // assume anything else is already loaded, including SVGElement,
            // because not all browsers implement the load event properly
            return true;
        }
    }

    get canvasImageSource(): CanvasImageSource | null {
        if (this.sourceType === BackingMediaSourceType.AsyncMedia) {
            return (this.source as AsyncMedia).currentFrame;
        } else {
            return this.source as Exclude<BackingMediaSource, AsyncMedia>;
        }
    }

    get fastCanvasImageSource(): FastCanvasImageSource | null {
        switch (this.sourceType) {
        case BackingMediaSourceType.AsyncMedia:
            return (this.source as AsyncMedia).currentFrame;
        case BackingMediaSourceType.VideoFrame:
        case BackingMediaSourceType.ImageBitmap:
            return this.source as FastCanvasImageSource;
        default:
            return null;
        }
    }

    get presentationHash(): number {
        if (this.sourceType === BackingMediaSourceType.AsyncMedia) {
            return (this.source as AsyncMedia).presentationHash;
        } else {
            return this._presentationHash;
        }
    }
}
