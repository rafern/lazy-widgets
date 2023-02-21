import { Widget } from '../widgets/Widget';

/**
 * A layer in a {@link LayeredContainer}.
 *
 * @category Core
 */
export type Layer<W extends Widget> = {
    child: W;
    canExpand: boolean;
}
