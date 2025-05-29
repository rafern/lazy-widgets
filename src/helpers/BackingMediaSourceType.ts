export enum BackingMediaSourceType {
    /** A HTMLImageElement. */
    HTMLImageElement,
    /** A HTMLVideoElement. */
    HTMLVideoElement,
    /** A SVGImageElement. */
    SVGImageElement,
    /** A VideoFrame. */
    VideoFrame,
    /** A lazy-widgets AsyncImageBitmap */
    AsyncImageBitmap,
    /**
     * Anything else that can be painted immediately and has size information
     * (HTMLCanvasElement, ImageBitmap, OffscreenCanvas). Note that this will be
     * the assumed type for invalid media and null.
     */
    Immediate,
}
