/**
 * A helper class for checking whether the tab key is being pressed, and whether
 * the direction is reversed (by having shift pressed).
 *
 * @category Helper
 */
export class TabKeyHelper {
    private pointerDown = false;
    private tabState: boolean | null = null;
    private references = new Set<unknown>();
    private downListener: (event: KeyboardEvent) => void;
    private upListener: (event: KeyboardEvent) => void;
    private pDownListener: (event: PointerEvent) => void;
    private pUpListener: (event: PointerEvent) => void;
    private focusListener: (event: FocusEvent) => void;
    private blurListener: (event: FocusEvent) => void;
    private tabCheckQueue = new Array<(isTabInitiated: boolean) => void>();
    private focusEventQueued = false;
    private windowFocused = false;

    constructor() {
        this.downListener = (event: KeyboardEvent) => {
            if (event.key === 'Tab') {
                this.tabState = event.shiftKey;
            }
        }

        this.upListener = (event: KeyboardEvent) => {
            if (event.key === 'Tab') {
                this.tabState = null;
            }
        }

        this.pDownListener = (_event: PointerEvent) => {
            this.pointerDown = true;
        }

        this.pUpListener = (_event: PointerEvent) => {
            this.pointerDown = false;
        }

        this.focusListener = (_event: FocusEvent) => {
            // HACK relatedTarget is unreliable for checking if window got
            // focused on chromium. use windowFocused flag instead
            if (this.windowFocused) {
                return;
            }

            this.windowFocused = true;

            // HACK the pointerdown check only works properly on firefox for
            // checking whether a window focus was caused by a tab key press. on
            // chromium, the focus event is dispatched BEFORE the pointerdown
            // event, meaning we have to queue up an async task to check if the
            // focus really was initiated by a tab, or by a click
            if (!this.focusEventQueued) {
                this.focusEventQueued = true;
                setTimeout(() => {
                    this.focusEventQueued = false;
                    const queued = [...this.tabCheckQueue];
                    this.tabCheckQueue.length = 0;
                    const tabInitiated = this.pressed || !this.pointerDown;

                    for (const resolve of queued) {
                        resolve(tabInitiated);
                    }
                }, 0);
            }
        }

        this.blurListener = (event: FocusEvent) => {
            if (event.relatedTarget === null) {
                this.windowFocused = false;
                this.tabState = null;
                this.pointerDown = false;
            }
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
        } else if (this.pointerDown) {
            return Promise.resolve(false);
        } else if (this.focusEventQueued) {
            return new Promise((resolve, _) => this.tabCheckQueue.push(resolve));
        } else {
            // HACK the order of events can be messed up in some browsers,
            // requiring us to queue up an async task
            return new Promise((resolve, _) => {
                setTimeout(() => {
                    if (this.pressed) {
                        resolve(true);
                    } else if (this.pointerDown) {
                        resolve(false);
                    } else if (this.focusEventQueued) {
                        this.tabCheckQueue.push(resolve);
                    } else {
                        resolve(false);
                    }
                }, 0);
            });
        }
    }

    ref(key: unknown) {
        if (this.references.size === 0) {
            window.addEventListener('keydown', this.downListener, { capture: true, passive: true });
            window.addEventListener('keyup', this.upListener, { capture: true, passive: true });
            window.addEventListener('pointerdown', this.pDownListener, { capture: true, passive: true });
            window.addEventListener('pointerup', this.pUpListener, { capture: true, passive: true });
            window.addEventListener('focus', this.focusListener, { capture: true, passive: true });
            window.addEventListener('blur', this.blurListener, { capture: true, passive: true });
        }

        this.references.add(key);
    }

    unref(key: unknown) {
        this.references.delete(key);

        if (this.references.size === 0) {
            window.removeEventListener('keydown', this.downListener, { capture: true });
            window.removeEventListener('keyup', this.upListener, { capture: true });
            window.removeEventListener('pointerdown', this.pDownListener, { capture: true });
            window.removeEventListener('pointerup', this.pUpListener, { capture: true });
            window.removeEventListener('focus', this.focusListener, { capture: true });
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
