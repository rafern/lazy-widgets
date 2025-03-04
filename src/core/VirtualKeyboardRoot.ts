import { VirtualKeyboard } from '../widgets/VirtualKeyboard/VirtualKeyboard.js';
import { VirtualKeyboardTemplate, defaultVirtualKeyboardTemplate } from './VirtualKeyboardTemplate.js';
import { Root, RootProperties } from './Root.js';
import { Background } from '../widgets/Background.js';
import type { KeyboardDriver } from '../drivers/KeyboardDriver.js';
/**
 * Optional VirtualKeyboardRoot constructor properties.
 *
 * @category Core
 */
export interface VirtualKeyboardRootProperties extends RootProperties {
    /**
     * The keyboard template to use for the {@link VirtualKeyboard} Widget in a
     * {@link VirtualKeyboardRoot}.
     */
    keyboardTemplate?: VirtualKeyboardTemplate;
}

/**
 * A {@link Root} containing a single {@link VirtualKeyboard} widget.
 * Automatically disables itself if not needed, but
 * {@link VirtualKeyboardRoot#updateVisibility} must be called every frame for
 * this behaviour to occur.
 *
 * @category Core
 */
export class VirtualKeyboardRoot extends Root {
    /** The {@link KeyboardDriver} used by this root's virtual keyboard. */
    private readonly keyboardDriver: KeyboardDriver;

    constructor(keyboardDriver: KeyboardDriver, properties?: VirtualKeyboardRootProperties) {
        super(
            new Background(
                new VirtualKeyboard(
                    keyboardDriver,
                    properties?.keyboardTemplate ?? defaultVirtualKeyboardTemplate
                ),
                {
                    containerPadding: { left: 8, right: 8, top: 8, bottom: 8 },
                },
            ),
            properties
        );
        this.keyboardDriver = keyboardDriver;
    }

    /**
     * Update the visibility of this root; if the keyboard driver has no focused
     * root, then the root is disabled, else, it is enabled. Call this method
     * on every frame to automatically enable/disable the root if needed
     */
    updateVisibility(): void {
        // Update visibility of root by enabling/disabling it
        this.enabled = this.keyboardDriver.needsInput;
    }
}
