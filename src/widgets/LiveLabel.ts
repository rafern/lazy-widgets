import { BaseLabel } from './BaseLabel';

import type { Variable } from '../state/Variable';
import type { LabelProperties } from './BaseLabel';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { Root } from '../core/Root';
import type { Viewport } from '../core/Viewport';
import type { Widget } from './Widget';
import type { ObservableCallback } from '../state/ObservableCallback';

/**
 * A widget which displays a line of text.
 *
 * Similar to {@link Label}, except the variable attached to this label is
 * watched; when its value changes, the displayed text is updated. The variable
 * can also be swapped via the {@link LiveLabel#"textVariable"} accessor.
 *
 * @category Widget
 */
export class LiveLabel extends BaseLabel {
    static override autoXML: WidgetAutoXML = {
        name: 'label',
        inputConfig: [
            {
                mode: 'value',
                name: 'textVariable',
                validator: 'variable',
                optional: true
            }
        ]
    };

    /**
     * The current variable in this label. For internal use only, check
     * {@link LiveLabel#"textVariable"} for the public accessor.
     */
    protected _textVariable: Variable<string>;
    /**
     * The watch callback for the variable. For internal use only, used for
     * cleaning up the watcher.
     */
    protected _textVariableWatcher: ObservableCallback<string> | null = null;

    /**
     * @param textVariable - The variable to get the text for the label.
     */
    constructor(textVariable: Variable<string>, properties?: Readonly<LabelProperties>) {
        super(properties);

        this._textVariable = textVariable;
    }

    /** The current text value. */
    get currentText(): string {
        return this._textVariable.value;
    }

    /** The variable that is displayed in this label */
    set textVariable(textVariable: Variable<string>) {
        if (this._textVariable !== textVariable) {
            const oldTextVariable = this._textVariable;
            this._textVariable = textVariable;

            if (this._textVariableWatcher !== null) {
                oldTextVariable.unwatch(this._textVariableWatcher);
                textVariable.watch(this._textVariableWatcher, true);
            }
        }
    }

    get textVariable(): Variable<string> {
        return this._textVariable;
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        super.attach(root, viewport, parent);

        this._textVariableWatcher = (str) => this.textHelper.text = str ?? '';
        this._textVariable.watch(this._textVariableWatcher, true);
    }

    override detach(): void {
        super.detach();

        if (this._textVariableWatcher) {
            this._textVariable.unwatch(this._textVariableWatcher);
            this._textVariableWatcher = null;
        }
    }
}
