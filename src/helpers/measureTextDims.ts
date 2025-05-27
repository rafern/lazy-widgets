import { Msg } from "../core/Strings.js";
/** The rendering context used for measuring text. */
let measureContext: CanvasRenderingContext2D | null = null;
/** The default font style. */
let defaultFontStyle = '';

/**
 * An LFU cache entry for `measureCache`. `font` and `text` are the paramenters
 * passed to `measureTextDims`, while `metrics` is the output of that function
 * for these inputs. `hits` is the total amount of cache hits that the cache
 * entry has had in total. `lastHit` is the timestamp of the last cache hit this
 * entry has had; this is for preventing a heavy burst of text measurements for
 * the same text/font from monopolising the entire cache and slowing everything
 * down. When there is no space in the cache, expired entries (too old) will be
 * removed first, even if they have a large amount of hits. If there are no
 * expired entries, the last entry (least total hits) is removed instead.
 */
type CacheEntry = {
    font: string,
    text: string,
    letterSpacing: number,
    metrics: TextMetrics,
    hits: number,
    lastHit: number,
};

/**
 * The LFU cache of measured text. Contains a limited amount of text
 * measurements ordered by most to least frequently used.
 */
const measureCache: Array<CacheEntry> = [];

/** The size limit for the LFU cache (`measureCache`) */
const measureCacheLimit = 64;

/**
 * The minimum amount of time since the last hit for a cache entry to be
 * considered as expired, in milliseconds.
 */
const expiryThreshold = 10000;

export interface MeasureTextDimsOptions {
    letterSpacing?: number;
}

/**
 * Measures the dimensions of a given string of text with a given font.
 *
 * Note that the first time calling this function is slower than subsequent
 * calls because a dedicated canvas context must be created.
 *
 * @returns Returns a the TextMetrics of the measured text.
 *
 * @category Helper
 */
export function measureTextDims(text: string, font: string, options?: Readonly<MeasureTextDimsOptions>): TextMetrics {
    const measureTime = (new Date()).getTime();
    const letterSpacing = options?.letterSpacing ?? 0;

    // Get cached value
    let cacheHit: CacheEntry | null = null;
    let cacheHitIdx = -1;
    let removalIdx = measureCache.length - 1;
    for(let i = 0; i < measureCache.length; i++) {
        const cacheVal = measureCache[i];
        if(cacheVal.font === font && cacheVal.text === text && cacheVal.letterSpacing === letterSpacing) {
            cacheHit = cacheVal;
            cacheHitIdx = i;
            break;
        }

        // Mark last expired cache entry for removal. If none is found, the last
        // entry in the cache (even if not expired) is marked for removal.
        if(measureTime - cacheVal.lastHit > expiryThreshold) {
            removalIdx = i;
        }
    }

    // If there was a cache hit, increment hits, update last hit time, bump in
    // cache and return cached metrics
    if(cacheHit) {
        const newFreq = ++cacheHit.hits;
        cacheHit.lastHit = measureTime;

        if(cacheHitIdx > 0) {
            let candidateIdx = 0;
            for(; candidateIdx < cacheHitIdx; candidateIdx++) {
                if(measureCache[candidateIdx].hits <= newFreq) {
                    break;
                }
            }

            if(candidateIdx !== cacheHitIdx) {
                measureCache.splice(cacheHitIdx, 1);
                measureCache.splice(candidateIdx, 0, cacheHit);
            }
        }

        return cacheHit.metrics;
    }

    // Get canvas context if not yet got
    if(measureContext === null) {
        const tempCanvas = document.createElement('canvas');
        measureContext = tempCanvas.getContext('2d');
        if(measureContext === null) {
            throw new Error(Msg.CANVAS_CONTEXT);
        }

        measureContext.fontKerning = 'normal';
        defaultFontStyle = measureContext.font;
    }

    // Set font
    measureContext.font = font === '' ? defaultFontStyle : font;
    measureContext.letterSpacing = `${letterSpacing}px`;

    // Measure text
    const metrics = measureContext.measureText(text);

    // Cache metrics. Remove least frequently used text entry if cache size
    // exceeded.
    if(measureCacheLimit > 0) {
        if(measureCache.length === measureCacheLimit) {
            measureCache.splice(removalIdx, 1);
        }

        let candidateIdx = 0;
        for(; candidateIdx < measureCache.length; candidateIdx++) {
            if(measureCache[candidateIdx].hits <= 1) {
                break;
            }
        }

        measureCache.splice(candidateIdx, 0, {
            font, text, metrics, hits: 1, lastHit: measureTime, letterSpacing,
        });
    }

    return metrics;
}
