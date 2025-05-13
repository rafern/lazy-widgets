import { AsyncImageBitmap } from './AsyncImageBitmap.js';
import { createBackingCanvas, type BackingCanvasContext } from './BackingCanvas.js';
import { urlToBackingMediaSource } from './BackingMediaSource.js';
import { BackingMediaSourceType } from './BackingMediaSourceType.js';

// TODO support BackingMediaSource as backingMedia

export interface EffectImageBitmapOptions {
    tint?: number
    resolution?: number;
}

export class EffectImageBitmap extends AsyncImageBitmap {
    private innerBitmap: ImageBitmap | null = null;
    private ctx: BackingCanvasContext | null = null;
    private lastSrc: string | null = null;
    private waiting = false;
    private _presentationHash = -1;
    readonly tint: number;
    readonly resolution: number;

    constructor(readonly backingMedia: HTMLImageElement, options?: EffectImageBitmapOptions) {
        super();

        this.tint = options?.tint ?? 0xFFFFFF;
        this.resolution = options?.resolution ?? 1;

        // TODO should this be moved to an update-based approach?
        if (backingMedia.complete) {
            this.evaluateEffect();
        } else {
            backingMedia.addEventListener('load', () => {
                this.evaluateEffect();
            });
        }
    }

    static fromURL(url: string, options?: EffectImageBitmapOptions) {
        const [image, type] = urlToBackingMediaSource(url);
        if (type !== BackingMediaSourceType.HTMLImageElement) {
            throw new Error('Unsupported BackingMediaSource type');
        }

        return new EffectImageBitmap(image as HTMLImageElement, options);
    }

    override get width(): number {
        return this.backingMedia.width;
    }

    override get height(): number {
        return this.backingMedia.height;
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

            this.ctx = ctx;
        }

        return this.ctx;
    }

    private handleBitmapPromise(curSrc: string, promise: Promise<ImageBitmap>) {
        this.waiting = true;

        promise.then((bitmap) => {
            this._presentationHash++;
            this.innerBitmap = bitmap;
        }).catch((err) => {
            console.error(err);
        }).finally(() => {
            this.lastSrc = curSrc;
            this.waiting = false;
        });
    }

    private evaluateEffect() {
        const curSrc = this.backingMedia.src;
        if (this.waiting || curSrc === this.lastSrc || !this.backingMedia.complete) {
            return;
        }

        // special case if there is no tint; just convert image to bitmap
        if (this.tint === 0xFFFFFF) {
            this.handleBitmapPromise(curSrc, createImageBitmap(this.backingMedia));
            return;
        }

        // get context with target size
        const width  = Math.max(1, Math.round(this.backingMedia.width  * this.resolution));
        const height = Math.max(1, Math.round(this.backingMedia.height * this.resolution));
        const ctx = this.getScratchCtx(width, height);

        // tint image
        // source: https://stackoverflow.com/a/44558286
        ctx.drawImage(this.backingMedia, 0, 0, width, height);

        ctx.fillStyle = `#${this.tint.toString(16).padStart(6, '0')}`;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(this.backingMedia, 0, 0, width, height);

        // convert to bitmap
        this.handleBitmapPromise(curSrc, createImageBitmap(ctx.canvas, 0, 0, width, height));
    }

    override get bitmap(): ImageBitmap | null {
        this.evaluateEffect();
        return this.innerBitmap;
    }

    override get presentationHash(): number {
        return this._presentationHash;
    }
}
