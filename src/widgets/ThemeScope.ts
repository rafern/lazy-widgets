import { PassthroughWidget } from './PassthroughWidget.js';
import type { Theme } from '../theme/Theme.js';
import type { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
/**
 * A {@link PassthroughWidget} which changes the theme of its child and
 * completely ignores inherited themes.
 *
 * Can be constrained to a specific type of children.
 *
 * Since the new theme replaces the inherited theme, children of the child will
 * also inherit this theme since inherited themes are propagated down the widget
 * tree.
 *
 * @category Widget
 */
export class ThemeScope<W extends Widget = Widget> extends PassthroughWidget<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'theme-scope',
        inputConfig: [
            {
                mode: 'widget',
                name: 'child'
            },
            {
                mode: 'value',
                name: 'theme',
                validator: 'theme'
            }
        ]
    };

    /** The theme used for the child. */
    private _scopeTheme: Theme | undefined;

    constructor(child: W, theme?: Theme, properties?: Readonly<WidgetProperties>) {
        super(child, properties);
        this._scopeTheme = theme;
    }

    override set inheritedTheme(_theme: Theme | undefined) {
        super.inheritedTheme = this._scopeTheme;
    }

    override get inheritedTheme(): Theme | undefined {
        return this._scopeTheme;
    }

    set scopeTheme(scopeTheme: Theme | undefined) {
        if (this._scopeTheme === scopeTheme) {
            return;
        }

        this._scopeTheme = scopeTheme;
        super.inheritedTheme = this._scopeTheme;
    }

    get scopeTheme(): Theme | undefined {
        return this._scopeTheme;
    }
}
