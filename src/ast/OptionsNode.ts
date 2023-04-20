import { LoneOptionNode } from './LoneOptionNode.js';
import { ASTNode } from './ASTNode.js';
import { OptionNode } from './OptionNode.js';
import { OptionsObjectNode } from './OptionsObjectNode.js';

import type { ASTInstantiationContext } from './ASTInstantiationContext.js';

export class OptionsNode extends ASTNode {
    static override readonly type = 'options';
    override readonly type = OptionsNode.type;
    static override readonly typeGroup = null;
    override readonly typeGroup = OptionsNode.typeGroup;

    private warnExpansion(): void {
        console.warn('Options object expansion needed because there is both an options node and at least one lone-option node');
    }

    evaluate(context: ASTInstantiationContext): Record<string, unknown> | undefined {
        let options: Record<string, unknown> | undefined;
        let needsExpansion = false;
        let warned = false;

        const filteredChildren = new Array<OptionNode>();
        for (const child of this.children) {
            if (OptionNode.derives(child)) {
                filteredChildren.push(child);
            } else {
                throw 'ded'; // TODO
            }
        }

        if (filteredChildren.length === 1 && filteredChildren[0].isa(OptionsObjectNode)) {
            return filteredChildren[0].evaluate(context);
        } else {
            for (const child of filteredChildren) {
                if (child.isa(LoneOptionNode)) {
                    if (options === undefined) {
                        options = {};
                    } else if (needsExpansion) {
                        if (!warned) {
                            this.warnExpansion();
                            warned = true;
                        }

                        needsExpansion = false;
                        options = { ...options };
                    }

                    options[child.name] = child.evaluate(context);
                } else if (child.isa(OptionsObjectNode)) {
                    if (options === undefined) {
                        options = child.evaluate(context);
                        needsExpansion = true;
                    } else {
                        if (!warned) {
                            this.warnExpansion();
                            warned = true;
                        }

                        const subObj = child.evaluate(context);
                        for (const name of Object.getOwnPropertyNames(subObj)) {
                            options[name] = subObj[name];
                        }
                    }
                } else {
                    throw 'ded'; // TODO
                }
            }
        }

        return options;
    }
}
