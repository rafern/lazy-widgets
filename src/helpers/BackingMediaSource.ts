import { AsyncImageBitmap } from './AsyncImageBitmap.js';

export const enum BackingMediaSourceType {
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
     * the assumed type for invalid media.
     */
    Immediate,
}

export type BackingMediaSource = CanvasImageSource | AsyncImageBitmap;

export function getBackingMediaSourceType(image: BackingMediaSource): BackingMediaSourceType {
    if (image instanceof Element) {
        if (image.namespaceURI === 'http://www.w3.org/1999/xhtml') {
            switch(image.tagName) {
            case 'IMG': return BackingMediaSourceType.HTMLImageElement;
            case 'VIDEO': return BackingMediaSourceType.HTMLVideoElement;
            case 'CANVAS': return BackingMediaSourceType.Immediate;
            }
        } else if (image.namespaceURI === 'http://www.w3.org/2000/svg') {
            switch(image.tagName) {
            case 'IMAGE': return BackingMediaSourceType.SVGImageElement;
            }
        }
    } else if (image instanceof AsyncImageBitmap) {
        return BackingMediaSourceType.AsyncImageBitmap;
    } else if (image instanceof VideoFrame) {
        return BackingMediaSourceType.VideoFrame;
    }

    return BackingMediaSourceType.Immediate;
}

const VIDEO_REGEX = /^.*\.(webm|og[gv]|m(p4|4v|ov)|avi|qt)$/i;

export function urlToBackingMediaSource(url: string): [media: BackingMediaSource, type: BackingMediaSourceType] {
    if(VIDEO_REGEX.test(url)) {
        const videoElem = document.createElement('video');
        videoElem.crossOrigin = 'anonymous';
        videoElem.src = url;
        // So that video poster shows. If you're passing your own video element
        // then this won't be automatically set
        videoElem.preload = 'auto';
        return [videoElem, BackingMediaSourceType.HTMLVideoElement];
    } else {
        const imgElem = document.createElement('img');
        imgElem.crossOrigin = 'anonymous';
        imgElem.src = url;
        return [imgElem, BackingMediaSourceType.HTMLImageElement];
    }
}
