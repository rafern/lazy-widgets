import { WidgetNode } from './WidgetNode.js';
import { UnnamedArgumentNode } from './UnnamedArgumentNode.js';

import type { LayerInit } from '../core/LayerInit.js';
import type { ASTInstantiationContext } from './ASTInstantiationContext.js';
import type { Widget } from '../index.js';

export class LayerNode extends UnnamedArgumentNode {
    static override readonly type = 'layer';
    override readonly type = LayerNode.type;

    constructor(public nameRaw?: string, public canExpandRaw?: string) {
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

        let name: string | undefined;
        if (this.nameRaw !== undefined) {
            const parsedName = context.parser.parseAttributeValue(this.nameRaw, context);

            if (typeof parsedName !== 'string') {
                throw new Error('Unexpected non-string layer name');
            }

            name = parsedName;
        }

        let canExpand: boolean | undefined;
        if (this.canExpandRaw !== undefined) {
            const parsedCanExpand = context.parser.parseAttributeValue(this.canExpandRaw, context);

            if (typeof parsedCanExpand !== 'boolean') {
                throw new Error('Unexpected non-boolean layer can-expand');
            }

            canExpand = parsedCanExpand;
        }

        return { name, canExpand, child: widget };
    }
}
