export function validateImageSource(value: unknown): HTMLImageElement | HTMLVideoElement | string {
    if (typeof value === 'string' || value instanceof HTMLImageElement || value instanceof HTMLVideoElement) {
        return value;
    }

    throw new Error('Invald image source; not a string, HTMLImageElement or HTMLVideoElement instance');
}
