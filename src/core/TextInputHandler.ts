export enum TextInputHandlerEventType {
    Dismiss,
    Input,
    MoveCursor,
}

export type TextInputHandlerEventData =
    [type: TextInputHandlerEventType.Dismiss] |
    [type: TextInputHandlerEventType.Input, text: string, selectStart: number, selectEnd: number] |
    [type: TextInputHandlerEventType.MoveCursor, selectStart: number, selectEnd: number];

export type TextInputHandlerListener = (...eventData: TextInputHandlerEventData & { 0: TextInputHandlerEventType }) => void;

export abstract class TextInputHandler {
    /**
     * Create a new text input handler. Note that the signature of this
     * constructor in base classes must have a single `listener` argument. Must
     * not change the current focus.
     */
    constructor(readonly listener: TextInputHandlerListener, readonly domElems: ReadonlyArray<HTMLElement>) {}

    /** Update the text and selection of the input. Should focus the input. */
    abstract askInput(currentText: string, selectStart: number, selectEnd: number): void;
    /** Change selection of input. */
    abstract select(selectStart: number, selectEnd: number): void;
    /** Dismiss input handler. Must call super if overridden. */
    dismiss(): void {
        this.listener(TextInputHandlerEventType.Dismiss);
    }
    /** Unfocus the input handler. May cause a dismiss; does so by default. */
    unfocus(): void {
        this.dismiss();
    }
}
