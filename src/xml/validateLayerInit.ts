import { Widget } from '../widgets/Widget.js';
import type { LayerInit } from '../core/LayerInit.js';
/**
 * A validator function which checks whether an input value is a
 * {@link LayerInit}. Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateLayerInit(value: unknown): [value: LayerInit<Widget>, stop: boolean] {
    if (typeof value !== 'object') {
        throw new Error('Invalid LayerInit; not an object');
    }

    if (value === null) {
        throw new Error('Invalid LayerInit; null');
    }

    const li = value as LayerInit<Widget>;

    if (!(li.child instanceof Widget)) {
        throw new Error('Invalid LayerInit; child is not a Widget');
    }
    if (li.name !== undefined && typeof li.name !== 'string') {
        throw new Error('Invalid LayerInit; name was provided but is not a string');
    }
    if (li.canExpand !== undefined && typeof li.canExpand !== 'boolean') {
        throw new Error('Invalid LayerInit; canExpand was provided but is not a boolean');
    }

    return [li, false];
}
