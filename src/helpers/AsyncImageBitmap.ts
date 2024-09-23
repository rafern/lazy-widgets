export abstract class AsyncImageBitmap {
    abstract readonly width: number;
    abstract readonly height: number;
    abstract readonly bitmap: ImageBitmap | null;
    abstract readonly presentationHash: number;
}
