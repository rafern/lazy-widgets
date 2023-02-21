import { WidgetProperties } from './Widget';

/**
 * Optional constructor properties for widgets that have a `clickable` field,
 * such as the {@link Button} widget.
 *
 * @category Core
 */
export interface ClickableWidgetProperties extends WidgetProperties {
    /** Sets the `clickable` field. Defaults to true */
    clickable?: boolean,
}
