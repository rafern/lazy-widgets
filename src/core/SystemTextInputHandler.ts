import { TextInputHandler, TextInputHandlerEventType, type TextInputHandlerListener } from './TextInputHandler.js';

const BLUR_DISMISS_TIMEOUT = 500;
const EV_LISTEN_OPTS = { passive: true, capture: true };

/**
 * The default implementation of {@link TextInputHandler}, for devices that have
 * a virtual keyboard (such as mobile devices).
 *
 * Can also be used in a WebXR session if the browser supports it, however, this
 * is not recommended, as some devices such as the Oculus Quest 2 will ignore
 * the initial value of the text input and the text selection, which leads to a
 * bad user experience.
 *
 * @category Core
 */
export class SystemTextInputHandler extends TextInputHandler {
    private textInputElem: HTMLInputElement;
    private dismissTimeout: number | null = null;

    constructor(listener: TextInputHandlerListener) {
        const input = document.createElement('input');
        input.style.position = 'fixed';
        input.style.left = '0';
        input.style.top = '0';
        // XXX can't set width to 0, otherwise selection becomes glitchy
        // input.style.width = '0px';
        input.style.height = '0px';
        input.style.margin = '0';
        input.style.padding = '0';
        input.style.borderStyle = 'none';
        input.style.outlineStyle = 'none';
        input.style.opacity = '0';
        input.tabIndex = -1;

        document.body.appendChild(input);

        super(listener, [input]);

        this.textInputElem = input;

        input.addEventListener('change', this.handleInput, EV_LISTEN_OPTS);
        input.addEventListener('input', this.handleInput, EV_LISTEN_OPTS);
        input.addEventListener('select', this.handleSelection, EV_LISTEN_OPTS);
        input.addEventListener('selectionchange', this.handleSelection, EV_LISTEN_OPTS);
        // HACK needed because selectionchange is broken on all chromium-based
        //      browsers
        document.addEventListener('selectionchange', this.handleSelection, EV_LISTEN_OPTS);
        input.addEventListener('blur', this.handleBlur, EV_LISTEN_OPTS);
        input.addEventListener('focus', this.handleFocus, EV_LISTEN_OPTS);
    }

    private handleInput = () => {
        const text = this.textInputElem.value;
        let start = this.textInputElem.selectionStart ?? text.length;
        let end = this.textInputElem.selectionEnd ?? text.length;
        if (this.textInputElem.selectionDirection === 'backward') {
            [start, end] = [end, start];
        }
        this.listener(TextInputHandlerEventType.Input, text, start, end);
    }

    private handleSelection = () => {
        let start = this.textInputElem.selectionStart;
        if (start === null) {
            return;
        }
        let end = this.textInputElem.selectionEnd ?? start;
        if (this.textInputElem.selectionDirection === 'backward') {
            [start, end] = [end, start];
        }
        this.listener(TextInputHandlerEventType.MoveCursor, start, end);
    }

    private handleBlur = () => {
        if (this.dismissTimeout !== null) {
            return;
        }
        this.dismissTimeout = setTimeout(() => {
            this.dismiss();
        }, BLUR_DISMISS_TIMEOUT) as unknown as number;
    }

    private handleFocus = () => {
        if (this.dismissTimeout !== null) {
            clearTimeout(this.dismissTimeout);
            this.dismissTimeout = null;
        }
    }

    override askInput(currentText: string, selectStart: number, selectEnd: number): void {
        this.textInputElem.value = currentText;
        this.select(selectStart, selectEnd);
        // HACK delay focus otherwise it doesn't work
        setTimeout(() => {
            this.textInputElem.focus({ preventScroll: true });
        }, 10);
    }

    override select(selectStart: number, selectEnd: number): void {
        if (selectEnd < selectStart) {
            this.textInputElem.selectionDirection = "backward";
            this.textInputElem.selectionStart = selectEnd;
            this.textInputElem.selectionEnd = selectStart;
        } else {
            this.textInputElem.selectionStart = selectStart;
            this.textInputElem.selectionEnd = selectEnd;
        }
    }

    override dismiss(): void {
        this.textInputElem.removeEventListener('change', this.handleInput, EV_LISTEN_OPTS);
        this.textInputElem.removeEventListener('input', this.handleInput, EV_LISTEN_OPTS);
        this.textInputElem.removeEventListener('select', this.handleSelection, EV_LISTEN_OPTS);
        this.textInputElem.removeEventListener('selectionchange', this.handleSelection, EV_LISTEN_OPTS);
        // HACK needed because selectionchange is broken on all chromium-based
        //      browsers
        document.removeEventListener('selectionchange', this.handleSelection, EV_LISTEN_OPTS);
        this.textInputElem.removeEventListener('blur', this.handleBlur, EV_LISTEN_OPTS);
        this.textInputElem.removeEventListener('focus', this.handleFocus, EV_LISTEN_OPTS);

        const parent = this.textInputElem.parentElement;
        if (parent) {
            parent.removeChild(this.textInputElem);
        }

        this.listener(TextInputHandlerEventType.Dismiss);
    }
}
