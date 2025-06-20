import { layoutField, damageArrayField, watchField } from '../decorators/FlagFields.js';
import { PointerReleaseEvent } from '../events/PointerReleaseEvent.js';
import { TextPasteEvent } from '../events/TextPasteEvent.js';
import { PointerEvent } from '../events/PointerEvent.js';
import { PointerPressEvent } from '../events/PointerPressEvent.js';
import { PointerWheelEvent } from '../events/PointerWheelEvent.js';
import { Widget, WidgetProperties } from './Widget.js';
import { PointerMoveEvent } from '../events/PointerMoveEvent.js';
import { TextHelper } from '../helpers/TextHelper.js';
import { AutoScrollEvent } from '../events/AutoScrollEvent.js';
import { KeyPressEvent } from '../events/KeyPressEvent.js';
import { FocusType } from '../core/FocusType.js';
import { LeaveEvent } from '../events/LeaveEvent.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { TricklingEvent } from '../events/TricklingEvent.js';
import { FocusEvent } from '../events/FocusEvent.js';
import { BlurEvent } from '../events/BlurEvent.js';
import { type Bounds } from '../helpers/Bounds.js';
import { type Rect } from '../helpers/Rect.js';
import { type WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { type Box } from '../state/Box.js';
import { type ValidatedBox } from '../state/ValidatedBox.js';
import { Variable } from '../state/Variable.js';
import { type TextInputHandler, TextInputHandlerEventType } from '../index.js';

/**
 * Optional TextInput constructor properties.
 *
 * @category Widget
 */
export interface TextInputProperties extends WidgetProperties {
    /** Sets {@link TextInput#hideText}. */
    hideText?: boolean,
    /** Sets {@link TextInput#wrapText}. */
    wrapText?: boolean,
    /** Sets {@link TextInput#inputFilter}. */
    inputFilter?: ((input: string) => boolean) | null,
    /** Sets {@link TextInput#typeableTab}. */
    typeableTab?: boolean,
    /** Sets {@link TextInput#editingEnabled}. */
    editingEnabled?: boolean
}

/**
 * A flexbox widget that allows for a single line of text input.
 *
 * Supports obscuring the text with {@link TextInput#hideText}, which shows all
 * characters as black circles like in password fields, text validation and
 * toggling editing.
 *
 * If a {@link TextInputHandler} is set, then that will be used instead of
 * keyboard input for mobile compatibility.
 *
 * @category Widget
 */
export class TextInput extends Widget {
    static override autoXML: WidgetAutoXML = {
        name: 'text-input',
        inputConfig: [
            {
                mode: 'value',
                name: 'variable',
                validator: 'box',
                optional: true
            }
        ]
    };

    /**
     * At what timestamp did the blinking start. If 0, then the text cursor is
     * not blinking.
     */
    private blinkStart = 0;
    /**
     * Was the cursor shown last frame due to blinking? If null, then the text
     * cursor is not blinking.
     */
    private blinkWasOn: boolean | null = null;
    /** Current cursor position (index, not offset). */
    private cursorPos = 0;
    /** Current cursor offset in pixels. */
    private cursorOffset: [number, number] = [0, 0];
    /** Current cursor selection start position (index, not offset). */
    private selectPos = 0;
    /** Current cursor selection start offset in pixels. */
    private selectOffset: [number, number] = [0, 0];
    /** Does the cursor offset need to be updated? */
    private cursorOffsetDirty = false;
    /** {@link TextInput#editingEnabled} but for internal use. */
    private _editingEnabled: boolean;
    /** Is the text hidden? */
    @watchField(TextInput.prototype.hideTextWatchCallback)
    hideText: boolean;
    /** The helper for measuring/painting text */
    protected textHelper: TextHelper;
    /** Current offset of the text in the text box. Used on overflow. */
    @damageArrayField()
    private offset = [0, 0];
    /** Is text wrapping enabled? If not, text will be panned if needed */
    @layoutField
    wrapText: boolean;
    /**
     * An input filter; a function which dictates whether a certain input can be
     * inserted in the text. If the function returns false given the input,
     * then the input will not be inserted in the text. Useful for preventing
     * newlines or forcing numeric input. Note that the input is not
     * neccessarily a character; it can be a whole sentence.
     */
    inputFilter: ((input: string) => boolean) | null;
    /** Is the pointer dragging? */
    private dragging = false;
    /** When was the last pointer click? For detecting double/triple-clicks */
    private lastClick = 0;
    /**
     * The cursor position when dragging was started. Used for
     * double/triple-click dragging.
     */
    private dragStart = -1;
    /**
     * How many clicks have there been after a first click where the time
     * between each click is less than 500 ms. Used for detecting double/triple
     * clicks
     */
    private successiveClickCount: 0 | 1 | 2 = 0;
    /**
     * Can tab characters be typed in this input widget? If true, then pressing
     * tab will not move the focus to the next widget, unless tab is a filtered
     * character.
     *
     * If tab is not a filtered character and this is true, holding shift will
     * move to the next widget instead of typing the character, not move to the
     * previous focusable widget.
     */
    @watchField(TextInput.prototype.markDirtyCaret)
    typeableTab: boolean;
    /**
     * Should the caret position be {@link AutoScrollEvent | auto-scrolled}
     * after the layout is finalized?
     */
    private needsAutoScroll = false;
    /**
     * The helper for keeping track of the text value. If it's not a validated
     * box, then it will be assumed to always be valid.
     */
    readonly variable: ValidatedBox<string, unknown> | Box<string>;
    /** The callback used for the {@link TextInput#"variable"} */
    private readonly callback: () => void;
    /**
     * Is tab mode enabled? When enabled, pressing the tab key will type a tab
     * character instead of changing focus.
     *
     * Toggled automatically by pressing ctrl+m, but can be manually toggled by
     * changing this flag. If the TextInput grabs the keyboard focus, then this
     * is automatically disabled so that user flow isn't unexpectedly
     * interrupted.
     *
     * Does nothing if {@link TextInput#typeableTab} is disabled.
     */
    @watchField(TextInput.prototype.markDirtyCaret)
    tabModeEnabled = false;
    /**
     * Current text input handler. Make sure to call
     * {@link TextInputHandler#dismiss} if you want to get rid of it; don't just
     * set this to null.
     */
    protected currentTextInputHandler: TextInputHandler | null = null;

    constructor(variable: ValidatedBox<string, unknown> | Box<string> = new Variable(''), properties?: Readonly<TextInputProperties>) {
        super(properties);

        this.tabFocusable = true;
        this.textHelper = new TextHelper();
        this.variable = variable;
        this.callback = this.handleChange.bind(this);

        this.hideText = properties?.hideText ?? false;
        this.wrapText = properties?.wrapText ?? true;
        this.inputFilter = properties?.inputFilter ?? null;
        this.typeableTab = properties?.typeableTab ?? false;
        this._editingEnabled = properties?.editingEnabled ?? true;
    }

    /**
     * {@link TextInput#hideText} watcher callback method. Sets
     * {@link TextInput#cursorOffsetDirty} and marks the whole widget as dirty.
     */
    private hideTextWatchCallback(): void {
        this.cursorOffsetDirty = true;
        this.markWholeAsDirty();
    }

    /** Internal method for updating the caret rendering. */
    private markDirtyCaret(): void {
        if (this.blinkWasOn) {
            this.markWholeAsDirty();
        }
    }

    protected handleChange(): void {
        // clamp cursor positions if the new text has a smaller length
        // than the old text
        const textLength = this.variable.value.length;
        if(this.cursorPos > textLength) {
            this.cursorPos = textLength;
            this.cursorOffsetDirty = true;
        }
        if(this.selectPos > textLength) {
            this.selectPos = textLength;
            this.cursorOffsetDirty = true;
        }

        // if the text input is selected (caret enabled), then reset the blink
        // time
        if (this.blinkStart !== 0) {
            this.blinkStart = Date.now();
        }

        this.markWholeAsDirty();
    }

    protected override handleAttachment(): void {
        this.variable.watch(this.callback);
    }

    protected override handleDetachment(): void {
        this.variable.unwatch(this.callback);
    }

    protected override activate(): void {
        super.activate();
        this.blinkStart = 0;
        this.moveCursorTo(0, false);
    }

    protected override deactivate(): void {
        if (this.currentTextInputHandler) {
            this.currentTextInputHandler.dismiss();
        }

        super.deactivate();
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null ||
           property === 'inputTextInnerPadding' ||
           property === 'inputTextFont' ||
           property === 'inputTextHeight' ||
           property === 'inputTextSpacing' ||
           property === 'inputTextLetterSpacing') {
            this._layoutDirty = true;
            this.markWholeAsDirty();
            this.cursorOffsetDirty = true;
        } else if(property === 'inputBackgroundFill' ||
                property === 'inputTextFill' ||
                property === 'inputTextFillInvalid' ||
                property === 'inputTextFillDisabled') {
            this.markWholeAsDirty();
        } else if(property === 'cursorThickness' ||
                property === 'cursorIndicatorSize') {
            this.markDirtyCaret();
        } else if(property === 'inputTextAlign') {
            this.cursorOffsetDirty = true;
        }
    }

    /**
     * Is the text cursor shown?
     *
     * @returns Returns true if the text cursor is shown, false if not shown but the text input is in use, or null if the text cursor is not shown due to the text input not being in use.
     */
    get blinkOn(): boolean | null {
        if(this.blinkStart === 0) {
            return null;
        }

        const blinkRate = this.blinkRate;
        return Math.trunc(((Date.now() - this.blinkStart) / (500 * blinkRate)) % 2) === 0;
    }

    /**
     * Is editing enabled?
     *
     * If changed, the whole widget is marked as dirty. If disabled, blinking
     * stops and the cursor position is reset to the beginning.
     */
    get editingEnabled(): boolean {
        return this._editingEnabled;
    }

    set editingEnabled(editingEnabled: boolean) {
        if(this._editingEnabled !== editingEnabled) {
            this._editingEnabled = editingEnabled;

            // Disable blinking and reset cursor position if disabled
            if(!editingEnabled) {
                this.blinkStart = 0;
                this.moveCursorTo(0, false);
            }

            // Mark as dirty; the text color changes
            this.markWholeAsDirty();
        }
    }

    /**
     * The current text value.
     *
     * Should not be used internally as a setter (but using it as a getter is
     * fine); if you are extending TextInput, use this.variable.value instead.
     */
    set text(text: string) {
        this.variable.value = text;
    }

    get text(): string {
        return this.variable.value;
    }

    /**
     * Get the text as it is shown. If the text is hidden, all characters are
     * replaced with a black circle.
     */
    get displayedText(): string {
        if(this.hideText) {
            return '●'.repeat(this.variable.value.length);
        } else {
            return this.variable.value;
        }
    }

    /** The current line number, starting from 0. */
    get line(): number {
        return this.textHelper.getLine(this.cursorPos);
    }

    get effectiveTabMode(): boolean {
        return this.typeableTab && this.tabModeEnabled;
    }

    /** Auto-scroll to the caret if the {@link blinkStart | caret is shown}. */
    private autoScrollCaret(): void {
        // Auto-scroll if caret is shown
        if(this.blinkStart !== 0) {
            this.needsAutoScroll = true;
        }
    }

    /**
     * Move the cursor to a given index.
     *
     * Marks the widget as dirty and sets {@link TextInput#cursorOffsetDirty} to
     * true.
     *
     * @param select - Should this do text selection?
     */
    moveCursorTo(index: number, select: boolean): void {
        // Update cursor position, checking for boundaries
        this.cursorPos = Math.min(Math.max(index, 0), this.text.length);

        if(!select) {
            this.selectPos = this.cursorPos;
        }

        if (this.currentTextInputHandler) {
            this.currentTextInputHandler.select(this.selectPos, this.cursorPos);
        }

        // Update cursor offset
        this.cursorOffsetDirty = true;
        this.markWholeAsDirty();
        this.autoScrollCaret();
    }

    /**
     * Move the cursor by a given index delta. Calls
     * {@link TextInput#moveCursorTo}
     *
     * @param delta - The change in index; if a positive number, the cursor will be moved right by that amount, else, the cursor will be moved left by that amount.
     */
    moveCursor(delta: number, select: boolean): void {
        this.moveCursorTo(this.cursorPos + delta, select);
    }

    /**
     * Move the cursor given a given pointer offset.
     *
     * @param offsetX - The horizontal offset in pixels, relative to the text area with padding removed
     * @param offsetY - The vertical offset in pixels, relative to the text area with padding removed
     * @param select - Should this do text selection?
     */
    moveCursorFromOffset(offsetX: number, offsetY: number, select: boolean): void {
        [this.cursorPos, this.cursorOffset] = this.textHelper.findIndexOffsetFromOffset(
            [ offsetX, offsetY ],
        );

        if(!select) {
            this.selectPos = this.cursorPos;
            this.selectOffset = this.cursorOffset;
        }

        if (this.currentTextInputHandler) {
            this.currentTextInputHandler.select(this.selectPos, this.cursorPos);
        }

        // Start blinking cursor and mark component as dirty, to make sure that
        // the cursor blink always resets for better feedback
        this.blinkStart = Date.now();
        this.markWholeAsDirty();
        this.autoScrollCaret();
    }

    /**
     * Move the cursor by a given line delta. Calls
     * {@link TextInput#moveCursorFromOffset}
     *
     * @param delta - The change in line; if a positive number, the cursor will be moved down by that amount, else, the cursor will be moved up by that amount.
     */
    moveCursorLine(delta: number, select: boolean): void {
        this.moveCursorFromOffset(
            this.cursorOffset[0],
            this.cursorOffset[1] + (0.5 + delta) * this.textHelper.fullLineHeight + this.textHelper.firstLineVerticalOffset,
            select,
        );
    }

    /**
     * Move the cursor to the start of the line. Calls
     * {@link TextInput#moveCursorTo}
     */
    moveCursorStart(select: boolean): void {
        this.moveCursorTo(this.textHelper.getLineStart(this.line), select);
    }

    /**
     * Move the cursor to the end of the line. Calls
     * {@link TextInput#moveCursorTo}
     */
    moveCursorEnd(select: boolean): void {
        this.moveCursorTo(this.textHelper.getLineEnd(this.line, false), select);
    }

    /**
     * Move the cursor by skipping over a number of words. Calls
     * {@link TextInput#moveCursorTo}
     *
     * @param delta - The change in words; if a positive number, the cursor skip this amount of words, else, it will do the same, but backwards.
     */
    moveCursorWord(delta: number, select: boolean): void {
        if(delta == 0) {
            return;
        }

        const wordRegex = /\w/;
        const text = this.text;
        let targetPos = this.cursorPos;

        if(delta > 0) {
            while(delta > 0) {
                let insideWord = false;
                for(; targetPos <= text.length; targetPos++) {
                    if(targetPos < text.length && wordRegex.test(text[targetPos])) {
                        insideWord = true;
                    } else if(insideWord) {
                        break;
                    }
                }

                delta--;
            }
        } else {
            while(delta < 0) {
                targetPos--;
                let insideWord = false;
                for(; targetPos >= 0; targetPos--) {
                    if(targetPos >= 0 && wordRegex.test(text[targetPos])) {
                        insideWord = true;
                    } else if(insideWord) {
                        break;
                    }
                }

                targetPos++;
                delta++;
            }
        }

        this.moveCursorTo(targetPos, select);
    }

    /**
     * Deletes a range of text and moves the cursor to the start of the range.
     *
     * @param start - The inclusive index of the start of the text range
     * @param end - The exclusive index of the end of the text range
     */
    deleteRange(start: number, end: number): void {
        if(start === end) {
            return;
        }

        // Delete text
        this.variable.value = this.text.substring(0, start) + this.text.substring(end);

        // Update cursor position
        this.cursorPos = this.selectPos = start;
        this.cursorOffsetDirty = true;
        this.autoScrollCaret();
    }

    /**
     * Like {@link TextInput#moveCursorWord}, but for deleting words. Calls
     * {@link TextInput#moveCursorWord} and {@link TextInput#deleteRange}. If
     * text is being selected, delta is ignored and the selection is deleted
     * instead. Note that a delta of zero doesn't delete anything.
     */
    deleteWord(delta: number): void {
        if(delta === 0) {
            return;
        }

        // Delete selection
        if(this.cursorPos !== this.selectPos) {
            this.deleteRange(
                Math.min(this.cursorPos, this.selectPos),
                Math.max(this.cursorPos, this.selectPos),
            );
            return;
        }

        // Move cursor by wanted words
        const oldPos = this.cursorPos;
        this.moveCursorWord(delta, false);

        // If cursor position is different, delete
        if(oldPos !== this.cursorPos) {
            this.deleteRange(
                Math.min(oldPos, this.cursorPos),
                Math.max(oldPos, this.cursorPos),
            );
        }
    }

    /**
     * Insert text at the current cursor index. Calls
     * {@link TextInput#moveCursorTo} afterwards.
     */
    insertText(str: string): void {
        // Abort if input can't be inserted
        if(this.inputFilter !== null && !this.inputFilter(str)) {
            return;
        }

        if(this.selectPos === this.cursorPos) {
            // Insert string in current cursor position
            this.variable.value = this.text.substring(0, this.cursorPos) + str + this.text.substring(this.cursorPos);
            // Move cursor neccessary amount forward
            this.moveCursor(str.length, false);
        } else {
            const start = Math.min(this.cursorPos, this.selectPos);
            const end = Math.max(this.cursorPos, this.selectPos);

            // Replace text in selection with the one being inserted
            this.variable.value = this.text.substring(0, start) + str + this.text.substring(end);
            // Move cursor to end of selection after insert
            this.moveCursorTo(start + str.length, false);
        }
    }

    /**
     * Deletes a certain amount of characters in a given direction from the
     * current cursor index. Calls {@link TextInput#deleteRange} or
     * {@link TextInput#moveCursorTo} if neccessary. If text is being selected,
     * delta is ignored and the selection is deleted instead. Note that a delta
     * of zero doesn't delete anything.
     *
     * @param delta - The amount and direction of the deletion. For example, if 5, then 5 characters are deleted after the cursor. If -5, then 5 characters are deleted before the cursor and the cursor is moved 5 indices left.
     */
    deleteText(delta: number): void {
        if(delta === 0) {
            return;
        }

        if(this.cursorPos !== this.selectPos) {
            // Delete selection
            this.deleteRange(
                Math.min(this.cursorPos, this.selectPos),
                Math.max(this.cursorPos, this.selectPos),
            );
        } else if(delta > 0) {
            // Delete forwards
            this.variable.value = this.text.substring(0, this.cursorPos) + this.text.substring(this.cursorPos + delta);
            // XXX normally, deleting forwards doens't require updating the
            // cursor offset, but when there is text wrapping, delete can change
            // the cursor offset (pressing delete on a long word in the next
            // line, causing text wrapping to move the cursor to the previous
            // line). because of this edge case, mark the cursor offset as dirty
            this.cursorOffsetDirty = true;
            this.autoScrollCaret();
        } else {
            // Delete backwards
            // XXX can't just move cursor back by the delta, because the
            // variable watcher clamps the cursor the the text's range; if a
            // single character is deleted at the end, then the cursor will
            // actually move by 2 positions instead of 1! to fix this, calculate
            // the wanted cursor index before changing the text
            const wantedIndex = Math.max(this.cursorPos + delta, 0);
            this.variable.value = this.text.substring(0, this.cursorPos + delta) + this.text.substring(this.cursorPos);
            this.moveCursorTo(wantedIndex, false);
        }
    }

    /**
     * Select a range of text (either word or non-word, but not both) which
     * includes the given cursor position
     *
     * @returns Returns a 2-tuple with, respectively, the start and end of the range
     */
    private selectRangeAt(pos: number): [number, number] {
        const text = this.text;
        const wordRegex = /\w/;
        const isWord = wordRegex.test(text[pos]);
        const midPos = pos;

        // Grow left
        for(; pos >= 0; pos--) {
            if(wordRegex.test(text[pos]) !== isWord) {
                break;
            }
        }

        const startPos = pos + 1;

        // Grow right
        pos = midPos;
        for(; pos < text.length; pos++) {
            if(wordRegex.test(text[pos]) !== isWord) {
                break;
            }
        }

        this.autoScrollCaret();

        return [startPos, pos];
    }

    protected requestTextInput() {
        const root = this.root;

        if (!this.currentTextInputHandler) {
            const handler = root.getTextInput((...eventData) => {
                switch(eventData[0]) {
                case TextInputHandlerEventType.Dismiss:
                    if (handler === this.currentTextInputHandler) {
                        this.currentTextInputHandler = null;
                        this.root.dropFocus(FocusType.Keyboard, this);
                    }
                    break;
                case TextInputHandlerEventType.Input: {
                    const val = eventData[1];
                    if (this.inputFilter !== null && !this.inputFilter(val)) {
                        return;
                    }
                    this.variable.value = val;
                    this.cursorOffsetDirty = true;
                    // falls through
                }
                case TextInputHandlerEventType.MoveCursor: {
                    const oldSelectPos = this.selectPos;
                    const oldCursorPos = this.cursorPos;
                    this.selectPos = eventData[eventData.length - 2] as number;
                    this.cursorPos = eventData[eventData.length - 1] as number;
                    if (this.selectPos !== oldSelectPos || this.cursorPos !== oldCursorPos) {
                        this.cursorOffsetDirty = true;
                        this.markWholeAsDirty();
                    }
                }
                }
            }, this.variable.value);
            this.currentTextInputHandler = handler;
        }

        if (this.currentTextInputHandler) {
            this.currentTextInputHandler.askInput(this.variable.value, this.selectPos, this.cursorPos);
            root.requestFocus(FocusType.Keyboard, this);
        }
    }

    protected override handleEvent(baseEvent: WidgetEvent): Widget | null {
        if (baseEvent.propagation !== PropagationModel.Trickling) {
            if (baseEvent.isa(FocusEvent)) {
                // If keyboard focus is gained and the caret isn't shown yet, select the
                // last character and start blinking the caret
                if(baseEvent.focusType === FocusType.Keyboard && this.blinkStart === 0) {
                    this.blinkStart = Date.now();
                    this.selectPos = this.variable.value.length;
                    this.cursorPos = this.selectPos;
                    this.cursorOffsetDirty = true;
                    this.tabModeEnabled = false;
                    this.autoScrollCaret();
                    // FIXME this would break text input handlers, so it's
                    //       disabled for now. this also means that tabbing into
                    //       a widget will NOT open a text input handler, which
                    //       is ok 90% of the time, but not perfect
                    // this.requestTextInput();
                }

                return this;
            } else if (baseEvent.isa(BlurEvent)) {
                // Stop blinking cursor if keyboard focus lost and stop dragging if
                // pointer focus is lost
                if(baseEvent.focusType === FocusType.Keyboard) {
                    this.blinkStart = 0;

                    if (this.currentTextInputHandler) {
                        this.currentTextInputHandler.dismiss();
                    }
                }

                return this;
            } else {
                return super.handleEvent(baseEvent);
            }
        }

        // If editing is disabled, abort
        if(!this._editingEnabled) {
            return null;
        }

        const event = baseEvent as TricklingEvent;
        const root = this.root;

        if(event.isa(LeaveEvent)) {
            // Stop dragging if the pointer leaves the text input, since it
            // won't receive pointer release events outside the widget
            this.dragging = false;
            this.clearPointerStyle();
            return this;
        } else if(event.isa(PointerWheelEvent)) {
            // Don't capture wheel events
            return null;
        } else if(event instanceof PointerEvent) {
            // If this is a pointer event, set pointer style and handle clicks
            this.requestPointerStyle('text');

            // Request keyboard focus if this is a pointer press with the
            // primary button
            const isPressEvent = event.isa(PointerPressEvent);
            if(isPressEvent || event.isa(PointerMoveEvent)) {
                const isPress = isPressEvent && event.isPrimary;
                if(isPress) {
                    this.dragging = true;
                    const clickTime = (new Date()).getTime();

                    // Count successive clicks. Clicks counts as successive if
                    // they come after the last click in less than 500 ms
                    if(clickTime - this.lastClick < 500) {
                        this.successiveClickCount++;
                        // Wrap click counter around (there's no action above
                        // triple click)
                        if(this.successiveClickCount > 2) {
                            this.successiveClickCount = 0;
                        }
                    } else {
                        this.successiveClickCount = 0;
                    }

                    this.lastClick = clickTime;
                } else if(!this.dragging) {
                    return this;
                }

                // Update cursor position (and offset) from click position
                const padding = this.inputTextInnerPadding;
                this.moveCursorFromOffset(
                    event.x - this.x - padding.left + this.offset[0],
                    event.y - this.y - padding.top + this.offset[1],
                    (!isPress && this.dragging) || (isPress && event.shift),
                );

                if(isPress) {
                    // Prevent successive clicks from one cursor position to
                    // another from counting as successive clicks
                    if(this.cursorPos !== this.dragStart) {
                        this.successiveClickCount = 0;
                    }

                    this.dragStart = this.cursorPos;
                }

                if(this.successiveClickCount > 0) {
                    let start, end;

                    if(this.successiveClickCount === 1) {
                        // If double-click dragging, select ranges of text
                        // Get the text range at the cursor and at the start of the
                        // double click drag, then mush them together into a single
                        // range
                        const [doubleStart, doubleEnd] = this.selectRangeAt(this.dragStart);
                        const [curStart, curEnd] = this.selectRangeAt(this.cursorPos);
                        start = Math.min(doubleStart, curStart);
                        end = Math.max(doubleEnd, curEnd);
                    } else {
                        // If triple-click dragging, select lines of text
                        const startPos = Math.min(this.cursorPos, this.dragStart);
                        const startLine = this.textHelper.getLine(startPos);
                        start = this.textHelper.getLineStart(startLine);

                        const endPos = Math.max(this.cursorPos, this.dragStart);
                        const endLine = this.textHelper.getLine(endPos);
                        // Include newlines so that deleting a triple-click
                        // selection deletes entire lines
                        end = this.textHelper.getLineEnd(endLine);
                    }

                    // Set cursor positions. Get the drag direction and swap
                    // cursor and select pos depending on the direction
                    if(this.cursorPos >= this.dragStart) {
                        this.selectPos = start;
                        this.cursorPos = end;
                    } else {
                        this.selectPos = end;
                        this.cursorPos = start;
                    }

                    this.cursorOffsetDirty = true;
                    this.requestTextInput();
                }

                // Request focus
                root.requestFocus(FocusType.Keyboard, this);
            } else if(event.isa(PointerReleaseEvent) && event.isPrimary) {
                // Stop dragging
                this.dragging = false;

                // Get text input handler if available
                this.requestTextInput();
            }

            return this;
        } else if(event.isa(KeyPressEvent)) {
            // Stop dragging
            this.dragging = false;
            this.lastClick = 0;

            // Ignore all key presses with alt modifier
            if(event.alt) {
                return this;
            }

            // Ignore most key presses if control is pressed
            if(event.ctrl) {
                if(event.key === 'Backspace') {
                    this.deleteWord(-1); // Delete word backwards
                } else if(event.key === 'Delete') {
                    this.deleteWord(1); // Delete word forwards
                } else if(event.key === 'ArrowLeft') {
                    this.moveCursorWord(-1, event.shift); // Back-skip a word
                } else if(event.key === 'ArrowRight') {
                    this.moveCursorWord(1, event.shift); // Skip a word
                } else if(event.key === 'c' || event.key === 'C') {
                    // Copy selected text to clipboard, if any
                    if(this.cursorPos === this.selectPos) {
                        return this;
                    }

                    const selectedText = this.text.slice(
                        Math.min(this.cursorPos, this.selectPos),
                        Math.max(this.cursorPos, this.selectPos),
                    );

                    if(navigator.clipboard) {
                        navigator.clipboard.writeText(selectedText);
                    } else {
                        return this;
                    }
                } else if(event.key === 'a' || event.key === 'A') {
                    this.cursorPos = this.text.length;
                    this.selectPos = 0;
                    this.cursorOffsetDirty = true;
                    this.markWholeAsDirty();
                } else if(event.key === 'm' || event.key === 'M') {
                    if (this.typeableTab) {
                        this.tabModeEnabled = !this.tabModeEnabled;
                    }
                } else {
                    // XXX don't capture keys when pressing ctrl. chances are
                    // that this is a keyboard shortcut that does something
                    // special (like ctrl+v for pasting)
                    return null;
                }

                // Reset blink time for better feedback
                this.blinkStart = Date.now();
                return this;
            }

            // Regular key presses:
            if(event.key.length === 1) {
                this.insertText(event.key); // Insert character
            } else if(event.key === 'Backspace') {
                this.deleteText(-1); // Delete backwards
            } else if(event.key === 'Delete') {
                this.deleteText(1); // Delete forwards
            } else if(event.key === 'ArrowLeft') {
                this.moveCursor(-1, event.shift); // Move cursor left
            } else if(event.key === 'ArrowRight') {
                this.moveCursor(1, event.shift); // Move cursor right
            } else if(event.key === 'ArrowUp') {
                this.moveCursorLine(-1, event.shift); // Move cursor up
            } else if(event.key === 'ArrowDown') {
                this.moveCursorLine(1, event.shift); // Move cursor down
            } else if(event.key === 'PageUp' || event.key === 'PageDown') {
                // Move cursor up or down by the lines in the viewport height,
                // or a minimum of 3 lines
                const mul = event.key === 'PageUp' ? -1 : 1;
                const [_vpX, _vpY, _vpW, vpH] = this.viewport.rect;
                const lines = Math.max(Math.floor(vpH / this.textHelper.fullLineHeight), 3);
                this.moveCursorLine(lines * mul, event.shift);
            } else if(event.key === 'Home') {
                this.moveCursorStart(event.shift); // Move cursor to beginning
            } else if(event.key === 'End') {
                this.moveCursorEnd(event.shift); // Move cursor to end
            } else if(event.key === 'Escape') {
                // Return now so that blink time isn't reset.
                // Don't capture so that focus is dropped
                return null;
            } else if(event.key === 'Enter') {
                this.insertText('\n');
            } else if(event.key === 'Tab') {
                if(this.typeableTab && (event.virtual || (!event.shift && this.tabModeEnabled))) {
                    this.insertText('\t');
                } else {
                    return null; // don't capture, let tab select another widget
                }
            } else {
                return null; // Ignore key if it is unknown
            }

            // Reset blink time for better feedback
            this.blinkStart = Date.now();
        } else if(event.isa(TextPasteEvent)) {
            if(event.target === this) {
                // Insert pasted text
                this.insertText(event.text);

                // Reset blink time for better feedback
                this.blinkStart = Date.now();
            }
        } else if(event.target !== this) {
            // unhandled event type. don't capture
            return null;
        }

        return this;
    }

    protected override handlePreLayoutUpdate(): void {
        // Drop focus if editing is disabled
        if(!this.editingEnabled) {
            this.root.dropFocus(FocusType.Keyboard, this);
        }

        // Mark as dirty when a blink needs to occur
        if(this.blinkOn !== this.blinkWasOn) {
            this.markWholeAsDirty();
        }

        // Update TextHelper variables
        this.textHelper.text = this.displayedText;
        this.textHelper.font = this.inputTextFont;
        this.textHelper.lineHeight = this.inputTextHeight;
        this.textHelper.lineSpacing = this.inputTextSpacing;
        this.textHelper.letterSpacing = this.inputTextLetterSpacing;
        this.textHelper.alignMode = this.inputTextAlign;

        // Mark as dirty if text helper is dirty
        if(this.textHelper.dirty) {
            this.markWholeAsDirty();
            this._layoutDirty = true;
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Update cursor offset. Needs to be updated post-layout because it is
        // dependent on maxWidth. Round to nearest integer to avoid
        // anti-aliasing artifacts (cursor loses sharpness despite being fully
        // vertical)
        if(this.cursorOffsetDirty) {
            this.cursorOffset = this.textHelper.findOffsetFromIndex(this.cursorPos, true);

            if(this.selectPos === this.cursorPos) {
                this.selectOffset[0] = this.cursorOffset[0];
                this.selectOffset[1] = this.cursorOffset[1];
            } else {
                this.selectOffset = this.textHelper.findOffsetFromIndex(this.selectPos, true);
            }

            this.cursorOffsetDirty = false;
        }

        // Check if panning is needed
        const padding = this.inputTextInnerPadding;
        const innerWidth = this.textHelper.width;
        const innerHeight = this.textHelper.height;
        const usableWidth = this.width - padding.left - padding.right;
        const usableHeight = this.height - padding.top - padding.bottom;
        const candidateOffset = this.offset;
        const [cursorX, cursorY] = this.cursorOffset;

        if(innerWidth > usableWidth) {
            // Horizontal panning needed
            const deadZone = Math.min(20, usableWidth / 2);
            const left = candidateOffset[0] + deadZone;
            const right = candidateOffset[0] + usableWidth - deadZone;

            // Pan right
            if(cursorX > right) {
                candidateOffset[0] += cursorX - right;
            }

            // Pan left
            if(cursorX < left) {
                candidateOffset[0] -= left - cursorX;
            }

            // Clamp
            if(candidateOffset[0] + usableWidth > innerWidth) {
                candidateOffset[0] = innerWidth - usableWidth;
            }
            if(candidateOffset[0] < 0) {
                candidateOffset[0] = 0;
            }
        } else {
            // Horizontal panning not needed
            candidateOffset[0] = 0;
        }

        if(innerHeight > usableHeight) {
            // Vertical panning needed
            const fullLineHeight = this.textHelper.fullLineHeight;

            if(fullLineHeight >= usableHeight) {
                // Edge case - TextInput is not tall enough for a single line.
                // Pan so that at least the bottom of the line is visible
                candidateOffset[1] = cursorY + Math.max(this.textHelper.actualLineHeight + this.textHelper.firstLineVerticalOffset - usableHeight, 0);
            } else {
                const deadZone = usableHeight < 2 * fullLineHeight ? 0 : fullLineHeight / 2;
                const top = candidateOffset[1] + deadZone;
                const bottom = candidateOffset[1] + usableHeight - deadZone - fullLineHeight - this.textHelper.firstLineVerticalOffset;

                // Pan up or down
                if(cursorY < top) {
                    candidateOffset[1] -= top - cursorY;
                }
                if(cursorY > bottom) {
                    candidateOffset[1] += cursorY - bottom;
                }

                // Clamp
                if(candidateOffset[1] + usableHeight > innerHeight) {
                    candidateOffset[1] = innerHeight - usableHeight;
                }
                if(candidateOffset[1] < 0) {
                    candidateOffset[1] = 0;
                }
            }
        } else {
            // Vertical panning not needed
            candidateOffset[1] = 0;
        }

        this.offset = candidateOffset;

        if(this.needsAutoScroll) {
            this.needsAutoScroll = false;
            this.root.dispatchEvent(new AutoScrollEvent(this, this.caretBounds));
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Only expand to the needed dimensions, but take minimum width from
        // theme into account
        const padding = this.inputTextInnerPadding;
        const hPadding = padding.left + padding.right;
        this.textHelper.maxWidth = this.wrapText ? Math.max(maxWidth - hPadding, 0) : Infinity;
        if(this.textHelper.dirty) {
            this.markWholeAsDirty();
        }

        const effectiveMinWidth = Math.min(Math.max(this.inputTextMinWidth, minWidth), maxWidth);
        this.idealWidth = Math.min(Math.max(effectiveMinWidth, this.textHelper.width + hPadding), maxWidth);
        this.idealHeight = Math.min(Math.max(minHeight, this.textHelper.height + padding.top + padding.bottom), maxHeight);
    }

    override finalizeBounds(): void {
        const oldWidth = this.width;
        const oldHeight = this.height;

        super.finalizeBounds();

        if (oldWidth !== this.width || oldHeight !== this.height) {
            this.cursorOffsetDirty = true;
        }
    }

    /**
     * The rectangle that the caret occupies, relative to the TextInput's
     * top-left corner.
     */
    protected get caretRect(): Rect {
        const padding = this.inputTextInnerPadding;
        const rawCaretY = this.cursorOffset[1] - this.offset[1];
        const caretY = Math.round(rawCaretY);
        return [
            padding.left + this.cursorOffset[0] - this.offset[0],
            padding.top + caretY,
            this.cursorThickness,
            Math.floor(this.textHelper.fullLineHeight + rawCaretY) - caretY,
        ];
    }

    /** Similar to {@link TextInput#caretRect}, but uses absolute positions. */
    protected get caretAbsoluteRect(): Rect {
        const [x, y, w, h] = this.caretRect;
        return [x + this.x, y + this.y, w, h];
    }

    /** Similar to {@link TextInput#caretRect}, but gets bounds instead. */
    protected get caretBounds(): Bounds {
        const [x, y, w, h] = this.caretRect;
        return [x, x + w, y, y + h];
    }

    protected override handlePainting(_dirtyRects: Array<Rect>): void {
        // Paint background
        const ctx = this.viewport.context;
        ctx.fillStyle = this.inputBackgroundFill;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Start clipping
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.clip();

        // Paint background for selection if there is a selection
        const padding = this.inputTextInnerPadding;
        if(this.cursorPos !== this.selectPos && this.blinkOn !== null) {
            ctx.fillStyle = this.inputSelectBackgroundFill;
            if(this.cursorOffset[1] === this.selectOffset[1]) {
                // Same line
                const left = Math.min(this.cursorOffset[0], this.selectOffset[0]);
                const right = Math.max(this.cursorOffset[0], this.selectOffset[0]);
                const rawCaretY = this.cursorOffset[1] - this.offset[1];
                const caretY = Math.round(rawCaretY);
                ctx.fillRect(
                    this.x + padding.left + Math.floor(left - this.offset[0]),
                    this.y + padding.top + caretY,
                    right - Math.floor(left),
                    Math.floor(this.textHelper.fullLineHeight + rawCaretY) - caretY,
                );
            } else {
                // Spans multiple lines
                let topOffset: [number, number], bottomOffset: [number, number];
                if(this.cursorOffset[1] < this.selectOffset[1]) {
                    topOffset = this.cursorOffset;
                    bottomOffset = this.selectOffset;
                } else {
                    bottomOffset = this.cursorOffset;
                    topOffset = this.selectOffset;
                }

                // Top line:
                const fullLineHeight = this.textHelper.fullLineHeight;
                const topWidth = this.width + Math.ceil(this.offset[0] - topOffset[0] - padding.left);
                if(topWidth > 0) {
                    ctx.fillRect(
                        this.x + padding.left + Math.floor(topOffset[0] - this.offset[0]),
                        this.y + padding.top + Math.round(topOffset[1] - this.offset[1]),
                        topWidth,
                        fullLineHeight,
                    );
                }

                // Bottom line:
                const bottomWidth = bottomOffset[0] + padding.left - this.offset[0];
                const bottomRawCaretY = bottomOffset[1] - this.offset[1];
                const bottomCaretY = Math.round(bottomRawCaretY);
                if(bottomWidth > 0) {
                    ctx.fillRect(
                        this.x,
                        this.y + padding.top + bottomCaretY,
                        bottomWidth,
                        Math.floor(fullLineHeight + bottomRawCaretY) - bottomCaretY,
                    );
                }

                // Middle lines:
                const middleYOffset = Math.round(topOffset[1] + fullLineHeight);
                const middleHeight = bottomCaretY - middleYOffset;
                if(middleHeight > 0) {
                    ctx.fillRect(
                        this.x,
                        this.y + padding.top + middleYOffset - this.offset[1],
                        this.width,
                        middleHeight,
                    );
                }
            }
        }

        // Paint current text value
        let fillStyle;
        if(this._editingEnabled) {
            const valid = (this.variable as ValidatedBox<string, unknown> | (Box<string> & { valid: undefined })).valid;
            if(valid || valid === undefined) {
                fillStyle = this.inputTextFill;
            } else {
                fillStyle = this.inputTextFillInvalid;
            }
        } else {
            fillStyle = this.inputTextFillDisabled;
        }

        this.textHelper.paint(
            ctx, fillStyle,
            this.x + padding.left - this.offset[0],
            this.y + padding.top - this.offset[1],
        );

        // Paint blink
        const blinkOn = this.blinkOn;
        this.blinkWasOn = blinkOn;
        if(blinkOn) {
            ctx.fillStyle = fillStyle;
            const [cx, cy, cw, ch] = this.caretAbsoluteRect;
            ctx.fillRect(cx, cy, cw, ch);

            if (this.effectiveTabMode) {
                const indicatorSize = Math.min(ch, this.cursorIndicatorSize);
                const indicatorThickness = Math.min(cw * 0.4, this.cursorThickness);

                // pre-calc arrow points:
                //      2----3        <- top
                //       `\.  `\.
                // 0--------1    4    <- mty (mid top Y)
                // |             |
                // 9--------8    5    <- mby (mid bottom Y)
                //       ,/'  ,/'
                //      7----6        <- bottom
                //
                // ^    ^   ^^   ^
                // |    |   ||   |
                // left |   ||   right
                //      |   |mrx (mid right x)
                //      |   ix (inner X)
                //      mlx (mid left x)

                const halfSize = indicatorSize / 2;
                const halfThickness = indicatorThickness / 2;
                const left = cx + cw * 2;
                const unroundedRight = left + indicatorSize;
                const right = Math.ceil(unroundedRight);
                const top = Math.floor(cy);
                const unroundedBottom = cy + indicatorSize;
                const bottom = Math.ceil(unroundedBottom);
                const midX = left + halfSize;
                const mlx = Math.floor(midX - halfThickness);
                const mrx = Math.ceil(midX + halfThickness);
                const ix = Math.floor(unroundedRight - halfThickness);
                const midY = cy + halfSize;
                const mty = Math.floor(midY - halfThickness);
                const mby = Math.ceil(midY + halfThickness);

                // paint tab indicator arrow
                ctx.beginPath();
                ctx.moveTo(left, mty);
                ctx.lineTo(ix, mty);
                ctx.lineTo(mlx, top);
                ctx.lineTo(mrx, top);
                ctx.lineTo(right, mty);
                ctx.lineTo(right, mby);
                ctx.lineTo(mrx, bottom);
                ctx.lineTo(mlx, bottom);
                ctx.lineTo(ix, mby);
                ctx.lineTo(left, mby);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Stop clipping
        ctx.restore();
    }
}
