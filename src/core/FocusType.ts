/**
 * The focus type of an {@link Event}. Used to categorise events when focusing
 * {@link Widget | widgets} in {@link Root | roots}.
 *
 * @category Core
 */
export enum FocusType {
    /** Used for widgets that need pointer input, such as {@link Button} */
    Pointer = 0,
    /** Used for widgets that need text input, such as {@link TextInput} */
    Keyboard = 1,
    /**
     * Similar to keyboard focus, but used for checking whether a widget has
     * been tabbed into (focused by pressing the tab key).
     *
     * If a widget gains a tab focus, then it also gain a keyboard focus. If a
     * widgets gains a keyboard focus, then it also gains a tab focus. However,
     * losing the tab focus doesn't automatically lose the keyboard focus, and
     * losing the keyboard focus doesn't automatically lose the tab focus.
     *
     * This focus should only be used internally. Do not manually request tab
     * focus unless you know what you are doing.
     */
    Tab = 2,
}
