import { Msg } from '../core/Strings.js';
import { type FillStyle } from '../theme/FillStyle.js';
import { AsyncMedia, FastCanvasImageSource } from './AsyncMedia.js';
import { BackingMediaEventType } from './BackingMediaEventType.js';
import { incrementUint31 } from './incrementUint31.js';
import { measureTextDims } from './measureTextDims.js';

export interface TextMediaOptions {
    resolution?: number;
}

/**
 * Renders text as an ImageBitmap, which can then be used in widgets that
 * consume a {@link BackingMediaSource}, like {@link Icon}. Useful for using
 * font icons instead of images.
 *
 * Height is retreived by measuring the fontBoundingBoxAscent and
 * fontBoundingBoxDescent (falling back to actualBoundingBoxAscent and
 * actualBoundingBoxDescent), as well as the hangingBaseline (falling back to
 * the actualBoundingBoxAscent of the `M` character). Width is measured from the
 * text being rendered, however, it's set to be the same as the height if it's
 * smaller than the height to avoid issues with thin font icons (such as
 * vertical ellipsis). The font is assumed to already be loaded by the time this
 * class is instantiated.
 *
 * Throws if a scratch canvas can't be created.
 */
export class TextMedia extends AsyncMedia {
    private _bitmap: ImageBitmap | null = null;
    private _presentationHash = 0;
    override readonly width: number;
    override readonly height: number;
    readonly resolution: number;

    constructor(readonly text: string, readonly font: string, readonly fillStyle: FillStyle, options?: Readonly<TextMediaOptions>) {
        super();

        const metrics = measureTextDims(text, font);
        const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
        const hangingBaseline = metrics.hangingBaseline ?? measureTextDims('M', font).actualBoundingBoxAscent;
        const pad = Math.ceil(Math.max(ascent - hangingBaseline, descent));
        this.height = Math.ceil(hangingBaseline + pad * 2);
        this.width = Math.max(Math.ceil(metrics.width), this.height);

        this.resolution = options?.resolution ?? 1;

        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error(Msg.CANVAS_CONTEXT);
        }

        context.textAlign = 'center';
        context.font = font;
        context.fillStyle = fillStyle;
        context.fillText(text, Math.trunc(this.width * 0.5), this.height - pad);

        createImageBitmap(canvas).then((bitmap) => {
            this._presentationHash = incrementUint31(this._presentationHash);
            this._bitmap = bitmap;
            this.dispatchEvent(BackingMediaEventType.Loaded);
            this.dispatchEvent(BackingMediaEventType.Dirty);
        });
    }

    override get currentFrame(): FastCanvasImageSource | null {
        return this._bitmap;
    }

    override get presentationHash() {
        return this._presentationHash;
    }
}
