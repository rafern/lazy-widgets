import { VirtualKeyboard } from '../widgets/concrete-widgets.js';
import { DOMRoot } from './DOMRoot.js';
import { Background } from '../widgets/Background.js';
import { defaultVirtualKeyboardTemplate } from './VirtualKeyboardTemplate.js';
import type { VirtualKeyboardRootProperties } from './VirtualKeyboardRoot.js';
import type { KeyboardDriver } from '../drivers/KeyboardDriver.js';
/**
 * A {@link DOMRoot} with similar functionality to {@link VirtualKeyboardRoot}.
 * In this version {@link VirtualKeyboardRoot#updateVisibility} doesn't exist.
 * Instead, just call {@link DOMVirtualKeyboardRoot#update} like in DOMRoot.
 *
 * @category Core
 */
export class DOMVirtualKeyboardRoot extends DOMRoot {
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
                }
            ),
            properties
        );
        this.keyboardDriver = keyboardDriver;
    }

    /**
     * Update DOMRoot.
     *
     * If root is disabled, {@link DOMRoot#domElem}'s display style is set to
     * 'none', hiding it.
     *
     * Calls {@link Root#preLayoutUpdate}, {@link Root#resolveLayout},
     * {@link Root#postLayoutUpdate} and {@link Root#paint}.
     *
     * Also updates the visibility of this root; if the keyboard driver has no
     * focused root, then the root is disabled, else, it is enabled.
     */
    override update(): void {
        // Update visibility of root by enabling/disabling it
        this.enabled = this.keyboardDriver.needsInput;

        // Update normally
        super.update();
    }
}
