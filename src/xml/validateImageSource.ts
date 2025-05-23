import { type BackingCanvas } from '../helpers/BackingCanvas.js';

/**
 * A validator function which checks whether an input value is an image source.
 * An image source can be a string, an HTMLImageElement or an HTMLVideoElement.
 * Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateImageSource(value: unknown): [value: string | HTMLImageElement | HTMLVideoElement | BackingCanvas, stop: boolean] {
    if (typeof value === 'string' || value instanceof HTMLImageElement || value instanceof HTMLVideoElement || value instanceof HTMLCanvasElement || value instanceof OffscreenCanvas) {
        return [value, false];
    }

    throw new Error('Invald image source; not a string, HTMLImageElement or HTMLVideoElement instance');
}
