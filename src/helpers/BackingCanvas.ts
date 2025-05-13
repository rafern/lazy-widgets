export type BackingCanvas = OffscreenCanvas | HTMLCanvasElement;
export type BackingCanvasContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export function createBackingCanvas(width: number, height: number): BackingCanvas {
    if (window['OffscreenCanvas']) {
        return new OffscreenCanvas(width, height);
    } else {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
}
