import { WidgetNode } from './WidgetNode.js';
import { UnnamedArgumentNode } from './UnnamedArgumentNode.js';

import type { LayerInit } from '../core/LayerInit.js';
import type { ASTInstantiationContext } from './ASTInstantiationContext.js';
import type { Widget } from '../index.js';

export class LayerNode extends UnnamedArgumentNode {
    static override readonly type = 'layer';
    override readonly type = LayerNode.type;

    constructor(public name?: string, public canExpand: boolean = true) {
        super('layer');
    }

    evaluate(context: ASTInstantiationContext): LayerInit<Widget> {
        let widget = null;
        for (const child of this.children) {
            if (child.isa(WidgetNode)) {
                if (widget !== null) {
                    // TODO error
                }

                widget = child.evaluate(context);
            } else {
                // TODO error
            }
        }

        if (widget === null) {
            throw 'ded';
            // TODO error
        }

        return { name: this.name, canExpand: this.canExpand, child: widget };
    }
}
