import { AsyncMedia } from './AsyncMedia.js';
import { BackingMediaSourceType } from './BackingMediaSourceType.js';

export type BackingMediaSource = CanvasImageSource | AsyncMedia;

export function getBackingMediaSourceType(media: BackingMediaSource | null): BackingMediaSourceType {
    if (media instanceof Element) {
        if (media.namespaceURI === 'http://www.w3.org/1999/xhtml') {
            switch(media.tagName) {
            case 'IMG': return BackingMediaSourceType.HTMLImageElement;
            case 'VIDEO': return BackingMediaSourceType.HTMLVideoElement;
            case 'CANVAS': return BackingMediaSourceType.Immediate;
            }
        } else if (media.namespaceURI === 'http://www.w3.org/2000/svg') {
            switch(media.tagName) {
            case 'IMAGE': return BackingMediaSourceType.SVGImageElement;
            }
        }
    } else if (media instanceof AsyncMedia) {
        return BackingMediaSourceType.AsyncMedia;
    } else if (media instanceof VideoFrame) {
        return BackingMediaSourceType.VideoFrame;
    } else if (media instanceof ImageBitmap) {
        return BackingMediaSourceType.ImageBitmap;
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
