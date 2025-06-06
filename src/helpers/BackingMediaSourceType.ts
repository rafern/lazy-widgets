export enum BackingMediaSourceType {
    /** A HTMLImageElement. */
    HTMLImageElement,
    /** A HTMLVideoElement. */
    HTMLVideoElement,
    /** A SVGImageElement. */
    SVGImageElement,
    /** A VideoFrame. */
    VideoFrame,
    /** A lazy-widgets AsyncMedia */
    AsyncMedia,
    /** An ImageBitmap */
    ImageBitmap,
    /**
     * Anything else that can be painted immediately and has size information
     * (HTMLCanvasElement, OffscreenCanvas). Note that this will be the assumed
     * type for invalid media and null.
     *
     * Note that this source type is assumed to never change. If you are using
     * a canvas that could change, then you need to make an AsyncMedia-backed by
     * that canvas, so that you can dispatch dirty events.
     */
    Immediate,
}
