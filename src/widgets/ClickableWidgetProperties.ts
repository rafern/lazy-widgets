import { type ComplementaryClickHelper } from '../helpers/ComplementaryClickHelper.js';
import { type WidgetProperties } from './Widget.js';

/**
 * Optional constructor properties for widgets that have a `clickable` field,
 * such as the {@link Button} widget.
 *
 * @category Core
 */
export interface ClickableWidgetProperties extends WidgetProperties {
    /** Sets the `clickable` field. Defaults to true */
    clickable?: boolean,
    /**
     * An extra ClickHelper which is used by another widget that acts as a proxy
     * for the clickable widget. Useful for implementing labels for a clickable
     * (e.g. checkbox labels).
     */
    complementaryClickHelper?: ComplementaryClickHelper;
}
