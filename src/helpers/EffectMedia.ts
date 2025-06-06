import { AsyncMedia, type FastCanvasImageSource } from './AsyncMedia.js';
import { createBackingCanvas, type BackingCanvasContext } from './BackingCanvas.js';
import { BackingMediaEventType } from './BackingMediaEventType.js';
import { type BackingMediaSource, urlToBackingMediaSource } from './BackingMediaSource.js';
import { BackingMediaSourceType } from './BackingMediaSourceType.js';
import { BackingMediaWrapper } from './BackingMediaWrapper.js';
import { incrementUint31 } from './incrementUint31.js';
import { type Listener } from './Notifier.js';

export interface EffectMediaOptions {
    tint?: number
    resolution?: number;
}

export class EffectMedia extends AsyncMedia {
    private _currentFrame: FastCanvasImageSource | null = null;
    private ctx: BackingCanvasContext | null = null;
    private waiting = false;
    private dirty = true;
    readonly tint: number;
    readonly resolution: number;
    private readonly wrapper: BackingMediaWrapper;
    private lastPHashBeforeRemove = 0;
    private _presentationHash = 0;

    constructor(readonly backingMedia: BackingMediaSource, options?: EffectMediaOptions) {
        super();

        this.tint = options?.tint ?? 0xFFFFFF;
        this.resolution = options?.resolution ?? 1;

        this.wrapper = new BackingMediaWrapper(backingMedia);
    }

    private readonly onWrapperEvent = (ev: BackingMediaEventType) => {
        switch (ev) {
        case BackingMediaEventType.Resized:
            this.dispatchEvent(ev);
            break;
        case BackingMediaEventType.Dirty:
        case BackingMediaEventType.Loaded:
            this.dirty = true;
            this.evaluateEffect();
            break;
        }
    }

    override addEventListener(listener: Listener<BackingMediaEventType>): void {
        super.addEventListener(listener);

        if (this.listeners.size == 1) {
            if (this.lastPHashBeforeRemove !== this.wrapper.presentationHash) {
                this.dirty = true;
            }

            this.wrapper.addEventListener(this.onWrapperEvent);

            if (this.wrapper.loaded) {
                this.evaluateEffect();
            }
        }
    }

    override removeEventListener(listener: Listener<BackingMediaEventType>): boolean {
        const removed = super.removeEventListener(listener);

        if (removed && this.listeners.size == 0) {
            this.lastPHashBeforeRemove = this.wrapper.presentationHash;
            this.wrapper.removeEventListener(this.onWrapperEvent);
        }

        return removed;
    }

    static fromURL(url: string, options?: EffectMediaOptions) {
        const [source, type] = urlToBackingMediaSource(url);
        if (type === BackingMediaSourceType.HTMLVideoElement) {
            const video = source as HTMLVideoElement;
            video.muted = true;
            video.loop = true;
            video.play();
        }

        return new EffectMedia(source, options);
    }

    override get width(): number {
        return this.wrapper.width;
    }

    override get height(): number {
        return this.wrapper.height;
    }

    private getScratchCtx(width: number, height: number) {
        if (this.ctx) {
            const canvas = this.ctx.canvas;
            if (canvas.width !== width) {
                canvas.width = width;
            }
            if (canvas.height !== height) {
                canvas.height = height;
            }

            this.ctx.globalCompositeOperation = 'source-over';
        } else {
            const canvas = createBackingCanvas(width, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not create 2D offscreen context');
            }

            this.ctx = ctx as BackingCanvasContext;
        }

        return this.ctx;
    }

    private setCurrentFrame(currentFrame: FastCanvasImageSource) {
        this._presentationHash = incrementUint31(this._presentationHash);
        const firstTime = this._currentFrame === null;
        this._currentFrame = currentFrame;

        if (firstTime) {
            this.dispatchEvent(BackingMediaEventType.Loaded);
        }

        this.dispatchEvent(BackingMediaEventType.Dirty);
    }

    private handleBitmapPromise(promise: Promise<ImageBitmap>) {
        this.waiting = true;

        promise.then((bitmap) => {
            this.setCurrentFrame(bitmap);
        }).catch((err) => {
            console.error(err);
        }).finally(() => {
            this.waiting = false;
        });
    }

    private evaluateEffect() {
        if (this.waiting || !this.dirty) {
            return;
        }

        this.dirty = false;

        // special case if there is no tint; just convert image to bitmap
        if (this.tint === 0xFFFFFF) {
            const fastSource = this.wrapper.fastCanvasImageSource;
            if (fastSource) {
                this.setCurrentFrame(fastSource);
                this.waiting = false;
            } else {
                const source = this.wrapper.canvasImageSource;
                if (source) {
                    this.handleBitmapPromise(createImageBitmap(source));
                } else {
                    this.waiting = false;
                }
            }
            return;
        }

        if (!this.wrapper.loaded) {
            this.waiting = false;
            return;
        }

        const source = this.wrapper.canvasImageSource;
        if (!source) {
            this.waiting = false;
            return;
        }

        // get context with target size
        const width  = Math.max(1, Math.round(this.wrapper.width  * this.resolution));
        const height = Math.max(1, Math.round(this.wrapper.height * this.resolution));
        const ctx = this.getScratchCtx(width, height);

        // tint image
        // source: https://stackoverflow.com/a/44558286
        ctx.drawImage(source, 0, 0, width, height);

        ctx.fillStyle = `#${this.tint.toString(16).padStart(6, '0')}`;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(source, 0, 0, width, height);

        // convert to bitmap
        this.handleBitmapPromise(createImageBitmap(ctx.canvas, 0, 0, width, height));
    }

    override get currentFrame(): FastCanvasImageSource | null {
        this.evaluateEffect();
        return this._currentFrame;
    }

    override get presentationHash(): number {
        return this._presentationHash;
    }
}
