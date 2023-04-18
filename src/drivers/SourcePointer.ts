import type { PointerDriver } from './PointerDriver.js';

/**
 * The source of a pointer event. A pair containing the originating
 * {@link PointerDriver} and numerical pointer ID. If something uses this type,
 * it usually also allows `null` for anonymous/virtual sources.
 */
export type SourcePointer = Readonly<[driver: PointerDriver, pointerID: number]>;
