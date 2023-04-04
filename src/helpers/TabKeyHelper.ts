const INPUT_WINDOW_MS = 200;

/**
 * A helper class for checking whether the tab key is being pressed, and whether
 * the direction is reversed (by having shift pressed).
 *
 * @category Helper
 */
export class TabKeyHelper {
    private lastTabEvent = 0;
    private tabState: boolean | null = null;
    private references = new Set<unknown>();
    private downListener: (event: KeyboardEvent) => void;
    private upListener: (event: KeyboardEvent) => void;
    private focusListener: (event: FocusEvent) => void;
    private blurListener: (event: FocusEvent) => void;
    private windowFocused = false;
    private waitQueue = new Set<() => void>();

    constructor() {
        this.downListener = (event: KeyboardEvent) => {
            if (event.key === 'Tab') {
                this.handleTabEvent();
                this.tabState = event.shiftKey;
            }
        }

        this.upListener = (event: KeyboardEvent) => {
            if (event.key === 'Tab') {
                this.handleTabEvent();
                this.tabState = null;
            }
        }

        this.focusListener = (_event: FocusEvent) => {
            // HACK relatedTarget is unreliable for checking if window got
            // focused on chromium. use windowFocused flag instead
            if (this.windowFocused) {
                return;
            }

            this.windowFocused = true;
        }

        this.blurListener = (event: FocusEvent) => {
            if (event.relatedTarget === null) {
                this.windowFocused = false;
                this.tabState = null;
            }
        }
    }

    private handleTabEvent() {
        this.lastTabEvent = Date.now();
        for (const callback of Array.from(this.waitQueue)) {
            callback();
        }
    }

    get pressed() {
        return this.tabState !== null;
    }

    get directionReversed() {
        return this.tabState === true;
    }

    isTabInitiatedFocus(): Promise<boolean> {
        if (this.pressed) {
            return Promise.resolve(true);
        } else {
            // HACK most browsers either never dispatch a tab key event, or only
            //      dispatch the up event, which comes AFTER the focus event.
            //      wait in a predefined time window for the up event if needed
            const checkTime = Date.now();
            return new Promise((resolve, _reject) => {
                let timeout: number | null = null;

                const callback = () => {
                    if (timeout !== null) {
                        clearTimeout(timeout);
                    }

                    this.waitQueue.delete(callback);

                    if (checkTime - this.lastTabEvent <= INPUT_WINDOW_MS) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                };

                this.waitQueue.add(callback);
                timeout = setTimeout(callback, INPUT_WINDOW_MS) as unknown as number;
            });
        }
    }

    ref(key: unknown) {
        if (this.references.size === 0) {
            window.addEventListener('keydown', this.downListener, { capture: true });
            window.addEventListener('keyup', this.upListener);
            window.addEventListener('focus', this.focusListener);
            window.addEventListener('blur', this.blurListener, { capture: true, passive: true });
        }

        this.references.add(key);
    }

    unref(key: unknown) {
        this.references.delete(key);

        if (this.references.size === 0) {
            window.removeEventListener('keydown', this.downListener, { capture: true });
            window.removeEventListener('keyup', this.upListener);
            window.removeEventListener('focus', this.focusListener);
            window.removeEventListener('blur', this.blurListener, { capture: true });
        }
    }
}

let tabKeyHelper: TabKeyHelper | null = null;

/**
 * Get the global TabKeyHelper
 *
 * @category Helper
 */
export function getTabKeyHelper(): TabKeyHelper {
    if (!tabKeyHelper) {
        tabKeyHelper = new TabKeyHelper();
    }

    return tabKeyHelper;
}
