// similar to:
// https://github.com/TypeStrong/ts-node/issues/55#issuecomment-186679305

import { JSDOM } from 'jsdom';
const jsdom = new JSDOM('');

// setup global context without localStorage/sessionStorage support
for (const key of Object.getOwnPropertyNames(jsdom.window)) {
    if (!(key in global) && key !== 'localStorage' && key !== 'sessionStorage' && !key.startsWith('_')) {
        (global as Record<string, unknown>)[key] = jsdom.window[key];
    }
}
