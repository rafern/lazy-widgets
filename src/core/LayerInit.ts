import { Widget } from '../widgets/Widget.js';
/**
 * A layer initialization object to create a new {@link Layer} for a
 * {@link LayeredContainer}.
 *
 * @category Core
 */
export interface LayerInit<W extends Widget> {
    child: W;
    name?: string;
    canExpand?: boolean;
}
