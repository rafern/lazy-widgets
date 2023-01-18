import type { Widget } from '../widgets/Widget';
import type { FocusType } from './FocusType';
import type { Root } from './Root';

/**
 * Drivers are modular expansions to {@link Root | Roots}. Drivers can be
 * registered to multiple roots at the same time and contain hooks which are
 * called by registered roots.
 *
 * Drivers are commonly used to provide input to roots, but they could be used
 * to provide other functionality.
 *
 * @category Core
 */
export interface Driver {
    /** Hook called by {@link Root#preLayoutUpdate} */
    update(root: Root): void;
    /**
     * Hook called when driver is registered to an enabled root or when a root
     * that this driver is registered to is enabled.
     */
    onEnable(root: Root): void;
    /**
     * Hook called when driver is unregistered from an enabled root or when a
     * root that this driver is registered to is disabled.
     */
    onDisable(root: Root): void;
    /** Hook called by {@link Root#requestFocus} and {@link Root#clearFocus} */
    onFocusChanged(root: Root, focusType: FocusType, newFocus: Widget | null): void;
    /** Hook called by {@link Root#dispatchEvent} */
    onFocusCapturerChanged(root: Root, focusType: FocusType, oldCapturer: Widget | null, newCapturer: Widget | null): void;
}