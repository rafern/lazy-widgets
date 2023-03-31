import { BaseLabel } from './BaseLabel';
import { Variable } from '../state/Variable';

import type { LabelProperties } from './BaseLabel';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { VariableCallback } from '../state/Variable';
import type { Root } from '../core/Root';
import type { Viewport } from '../core/Viewport';
import type { Widget } from './Widget';

/**
 * A widget which displays a line of text.
 *
 * Similar to {@link Label}, except the variable attached to this label is
 * watched; when its value changes, the displayed text is updated. The variable
 * can also be swapped via the {@link LiveLabel#"variable"} accessor.
 *
 * @category Widget
 */
export class LiveLabel extends BaseLabel {
    static override autoXML: WidgetAutoXML = {
        name: 'label',
        inputConfig: [
            {
                mode: 'value',
                name: 'variable',
                validator: 'variable',
                optional: true
            }
        ]
    };

    /**
     * The current variable in this label. For internal use only, check
     * {@link LiveLabel#"variable"} for the public accessor.
     */
    protected _variable: Variable<string>;
    /**
     * The watch callback for the variable. For internal use only, used for
     * cleaning up the watcher.
     */
    protected _variableWatcher: VariableCallback<string> | null = null;

    /**
     * @param variable - The variable to get the text for the label.
     */
    constructor(variable: Variable<string> = new Variable(''), properties?: Readonly<LabelProperties>) {
        super(properties);

        this._variable = variable;
    }

    /** The current text value. */
    get currentText(): string {
        return this._variable.value;
    }

    /** The variable that is displayed in this label */
    set variable(variable: Variable<string>) {
        if (this._variable !== variable) {
            const oldVariable = this._variable;
            this._variable = variable;

            if (this._variableWatcher !== null) {
                oldVariable.unwatch(this._variableWatcher);
                variable.watch(this._variableWatcher, true);
            }
        }
    }

    get variable(): Variable<string> {
        return this._variable;
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        super.attach(root, viewport, parent);

        this._variableWatcher = (str) => this.textHelper.text = str ?? '';
        this.variable.watch(this._variableWatcher, true);
    }

    override detach(): void {
        super.detach();

        if (this._variableWatcher) {
            this.variable.unwatch(this._variableWatcher);
            this._variableWatcher = null;
        }
    }
}
