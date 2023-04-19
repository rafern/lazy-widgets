import { XMLUIParserNode } from './XMLUIParserNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';
import type { XMLUIParserScriptContext } from './XMLUIParserScriptContext.js';

export class ScriptNode extends XMLUIParserNode {
    static override readonly type = 'script';
    override readonly type = ScriptNode.type;
    static override readonly typeGroup = null;
    override readonly typeGroup = ScriptNode.typeGroup;

    constructor(public text: string) {
        super();
    }

    execute(context: XMLUIParserContext) {
        // script, check if we have permission to run it
        if (context.scriptImports === null) {
            throw new Error('Scripts are disabled'); // TODO
        }

        // create script context
        const scriptContext: XMLUIParserScriptContext = {
            variables: context.variableMap,
            ids: context.idMap
        };

        // exec in the global scope, passing the script context and defining all
        // imports
        const params = ['context'];
        const args: Array<unknown> = [scriptContext];

        for (const [key, value] of context.scriptImports) {
            params.push(key);
            args.push(value);
        }

        (new Function(...params, `"use strict"; ${this.text}`))(...args);
    }
}
