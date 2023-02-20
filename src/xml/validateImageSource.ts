export function validateImageSource(value: unknown): [value: string | HTMLImageElement | HTMLVideoElement, stop: boolean] {
    if (typeof value === 'string' || value instanceof HTMLImageElement || value instanceof HTMLVideoElement) {
        return [value, false];
    }

    throw new Error('Invald image source; not a string, HTMLImageElement or HTMLVideoElement instance');
}
