import { BaseLabel } from './BaseLabel';

import type { LabelProperties } from './BaseLabel';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { Root } from '../core/Root';
import type { Viewport } from '../core/Viewport';
import type { Widget } from './Widget';
import type { ObservableCallback } from '../state/ObservableCallback';
import type { Observable } from '../state/Observable';

/**
 * A widget which displays a line of text.
 *
 * Similar to {@link Label}, except the observable attached to this label is
 * watched; when its value changes, the displayed text is updated. The
 * observable can also be swapped via the {@link LiveLabel#textSource}
 * accessor.
 *
 * @category Widget
 */
export class LiveLabel extends BaseLabel {
    static override autoXML: WidgetAutoXML = {
        name: 'live-label',
        inputConfig: [
            {
                mode: 'value',
                name: 'text-source',
                validator: 'observable',
                optional: true
            }
        ]
    };

    /**
     * The current observable in this label. For internal use only, check
     * {@link LiveLabel#textSource} for the public accessor.
     */
    protected _textSource: Observable<string>;
    /**
     * The watch callback for the observable. For internal use only, used for
     * cleaning up the watcher.
     */
    protected _textWatcher: ObservableCallback<string> | null = null;
    /**
     * Does the displayed value need to be updated?
     */
    private textDirty = true;

    /**
     * @param textSource - The observable to get the text for the label.
     */
    constructor(textSource: Observable<string>, properties?: Readonly<LabelProperties>) {
        super(properties);

        this._textSource = textSource;
    }

    protected override handlePreLayoutUpdate(): void {
        if (this.textDirty) {
            this.textDirty = false;
            this.textHelper.text = this.textSource.value ?? '';
        }

        super.handlePreLayoutUpdate();
    }

    /** The current text value. */
    get currentText(): string {
        return this._textSource.value;
    }

    /** The observable that is displayed in this label */
    set textSource(textSource: Observable<string>) {
        if (this._textSource !== textSource) {
            const oldTextSource = this._textSource;
            this._textSource = textSource;

            if (this._textWatcher !== null) {
                oldTextSource.unwatch(this._textWatcher);
                textSource.watch(this._textWatcher, true);
            }
        }
    }

    get textSource(): Observable<string> {
        return this._textSource;
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        super.attach(root, viewport, parent);

        this._textWatcher = () => this.textDirty = true;
        this._textSource.watch(this._textWatcher, true);
    }

    override detach(): void {
        super.detach();

        if (this._textWatcher) {
            this._textSource.unwatch(this._textWatcher);
            this._textWatcher = null;
        }
    }
}
