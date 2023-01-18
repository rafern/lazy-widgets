import { RayPointerDriver } from './RayPointerDriver';
import type { PointerHint } from './PointerHint';

/**
 * A source of rays for a {@link RayPointerDriver}. Used so that different kinds
 * of ray sources (such as a raycasting mouse or raycasting XR controllers) can
 * be used in the same driver without having to extend the driver for each type
 * of source.
 *
 * @category Driver
 */
export interface RayPointerSource {
    /**
     * The {@link RayPointerDriver} assigned to this source. Register all
     * pointers needed by this source here. Don't call this directly, instead,
     * use {@link RayPointerDriver#addSource}
     */
    setRayPointerDriver(driver: RayPointerDriver): void
    /** Clear assigned {@link RayPointerDriver}. Rays will no longer be sent */
    clearRayPointerDriver(): void
    /** Called when a pointer has their hint changed */
    onPointerHintChanged(pointer: number, hint: PointerHint): void
}
