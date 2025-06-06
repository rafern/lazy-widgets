import { type BackingMediaEventType } from './BackingMediaEventType.js';
import { Notifier } from './Notifier.js';

export type FastCanvasImageSource = ImageBitmap | VideoFrame;

export abstract class AsyncMedia extends Notifier<BackingMediaEventType> {
    abstract readonly width: number;
    abstract readonly height: number;
    abstract readonly currentFrame: FastCanvasImageSource | null;
    abstract readonly presentationHash: number;
}
