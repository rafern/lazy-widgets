import { PassthroughWidget } from './PassthroughWidget';

import type { Theme } from '../theme/Theme';
import type { Widget } from './Widget';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

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
    static override autoXML: WidgetAutoXML = [
        {
            mode: 'widget',
            name: 'child'
        },
        {
            mode: 'value',
            name: 'theme',
            validator: 'theme'
        }
    ];

    /** The theme used for the child. */
    private scopeTheme: Theme;

    constructor(child: W, theme: Theme) {
        super(child);
        this.scopeTheme = theme;
    }

    override set inheritedTheme(_theme: Theme | undefined) {
        super.inheritedTheme = this.scopeTheme;
    }

    override get inheritedTheme(): Theme | undefined {
        return this.scopeTheme;
    }
}
