import { XMLUIParserNode } from './XMLUIParserNode.js';
import { ScriptNode } from './ScriptNode.js';
import { UITreeNode } from './UITreeNode.js';

import type { Widget } from '../widgets/Widget.js';
import type { XMLUIParserConfig } from './XMLUIParserConfig.js';
import type { XMLUIParserContext } from './XMLUIParserContext.js';
import type { BaseXMLUIParser } from './BaseXMLUIParser.js';

const RESERVED_IMPORTS = ['context', 'window', 'globalThis'];

/**
 * Makes sure a map-like value, such as a Record, is transformed to a Map.
 *
 * @param record - The map-like value to transform. If nothing is supplied, then an empty Map is created automatically
 * @returns Returns a new Map that is equivalent to the input, or the input if the input is already a Map
 * @internal
 */
function normalizeToMap(record: Record<string, unknown> | Map<string, unknown> = new Map()) {
    if (!(record instanceof Map)) {
        const orig = record;
        record = new Map();

        for (const key of Object.getOwnPropertyNames(orig)) {
            record.set(key, orig[key]);
        }
    }

    return record;
}

export class RootNode extends XMLUIParserNode {
    static override readonly type = 'root';
    override readonly type = RootNode.type;
    static override readonly typeGroup = null;
    override readonly typeGroup = RootNode.typeGroup;

    instantiateUITrees(parser: BaseXMLUIParser, config?: XMLUIParserConfig): Map<string, Widget> {
        // setup context
        let scriptImports = null, variableMap;
        if (config) {
            if (config.allowScripts) {
                scriptImports = normalizeToMap(config.scriptImports);

                for (const name of scriptImports.keys()) {
                    if (RESERVED_IMPORTS.indexOf(name) >= 0) {
                        throw new Error(`The script import name "${name}" is reserved`);
                    }
                }
            }

            variableMap = normalizeToMap(config.variables);
        } else {
            scriptImports = new Map();
            variableMap = new Map();
        }

        const context: XMLUIParserContext = {
            parser, scriptImports, variableMap, idMap: new Map()
        };

        // instantiate wanted trees
        const trees = new Map<string, Widget>();
        for (const child of this.children) {
            if (child.isa(UITreeNode)) {
                if (child.name === undefined) {
                    throw 'ded'; // TODO
                } else if (trees.has(child.name)) {
                    throw 'ded'; // TODO
                }

                const widget = child.instantiate(context);
                trees.set(child.name, widget);
            } else if (child.isa(ScriptNode)) {
                child.execute(context);
            } else {
                // TODO
            }
        }

        return trees;
    }

    instantiateUITree(name: string, parser: BaseXMLUIParser, config?: XMLUIParserConfig): Widget {
        const widget = this.instantiateUITrees(parser, config).get(name);
        if (widget === undefined) {
            throw new Error(`Could not find UI tree with name "${name}"`);
        }

        return widget;
    }
}
