/**
 * The default implementation of {@link TextInputHandler}.
 *
 * Creates a new popup div with a CSS ID of 'textInputHandler' and an overlay
 * div with CSS ID 'textInputHandlerOverlay', adding both to the HTML body.
 * Resolves the promise once user input is finished by clicking the OK or Cancel
 * buttons.
 *
 * @category Core
 */
export function DefaultTextInputHandler(initialInput: string): Promise<string> {
    return new Promise((accept, _reject) => {
        function closePopup() {
            // Close text input popup
            document.body.removeChild(overlayElem);
        }

        function cancelHandler() {
            // Click cancel; close popup and accept with initial input string
            closePopup();
            accept(initialInput);
        }

        function okHandler() {
            // Click OK; close popup and accept with new input string
            closePopup();
            accept(inElem.value);
        }

        // Create overlay
        const overlayElem = document.createElement('div');
        overlayElem.id = 'textInputHandlerOverlay';

        // Create container
        const containerElem = document.createElement('div');
        containerElem.id = 'textInputHandler';

        // Create text element
        const textElem = document.createElement('p');
        textElem.textContent = 'Change text:';

        // Create input element
        const inElem = document.createElement('textarea');
        inElem.value = initialInput;

        // Create button row element
        const buttonRowElem = document.createElement('div');

        // Create cancel button element
        const cancelButtonElem = document.createElement('button');
        cancelButtonElem.addEventListener('click', cancelHandler);
        cancelButtonElem.textContent = 'Cancel';

        // Create OK button element
        const okButtonElem = document.createElement('button');
        okButtonElem.addEventListener('click', okHandler);
        okButtonElem.textContent = 'OK';

        // Add to row
        buttonRowElem.appendChild(cancelButtonElem);
        buttonRowElem.appendChild(okButtonElem);

        // Add to container
        containerElem.appendChild(textElem);
        containerElem.appendChild(inElem);
        containerElem.appendChild(buttonRowElem);

        // Add overlay and container to body
        overlayElem.appendChild(containerElem);
        document.body.appendChild(overlayElem);

        // Focus input
        inElem.focus({ preventScroll: false });
    });
}
