import { FillStyle } from './FillStyle.js';
import { Theme } from './Theme.js';

/**
 * A theme which always gives out a random canvas fill colour. Used for
 * debugging when painting occurs. Has no properties but always has a fallback
 * theme.
 *
 * @category Theme
 */
export class DebugTheme extends Theme {
    /**
     * @param fallback - The actual theme to use. Canvas fill color will be ignored as it is randomly generated. If none supplied, then the default theme found in {@link (Theme:constructor)} is used
     */
    constructor(fallback: Theme = new Theme()) {
        super(undefined, fallback);
    }

    override get canvasFill(): FillStyle {
        return '#' + Math.floor(Math.random() * 0xffffff).toString(16);
    }

    override set canvasFill(value: FillStyle | undefined) {
        super.canvasFill = value;
    }
}
