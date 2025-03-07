// Need to use unsafe code which abuses the any type
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TextHelper } from '../helpers/TextHelper.js';
import { BaseTheme } from '../theme/BaseTheme.js';
import { Widget } from '../widgets/Widget.js';
import { Msg } from './Strings.js';
import { Root } from './Root.js';
import { DebuggableCanvasViewport } from './DebuggableCanvasViewport.js';
import type { TextRenderGroup } from '../helpers/TextHelper.js';
import type { FillStyle } from '../theme/FillStyle.js';
import type { RootProperties } from './Root.js';
import type { CanvasViewport } from './CanvasViewport.js';
type ToggleCallback = (enabled: boolean) => void;

const features: Map<string, [enabled: boolean, description: string] | [enabled: boolean, description: string, toggleCallback: ToggleCallback]> = new Map();

/**
 * Check if a debug feature is enabled.
 *
 * @param debugFeature - The debug feature name, for example, "watchflag.Widget._layoutDirty"
 * @returns Returns true if the debug feature is enabled. If the feature doesn't exist or ins't enabled, returns false.
 *
 * @category Debug
 */
export function isDebugFeatureEnabled(debugFeature: string): boolean {
    const featureConfig = features.get(debugFeature);
    if(featureConfig === undefined) {
        console.warn(`Unknown debug feature "${debugFeature}"; defaulting to not enabled`);
        return false;
    }

    return featureConfig[0];
}

/**
 * Enable or disable a debug feature.
 *
 * @param debugFeature - The debug feature name, for example, "watchflag.Widget._layoutDirty"
 * @param enabled - Should the feature be enabled or disabled? If undefined, toggles the feature
 *
 * @category Debug
 */
export function toggleDebugFeature(debugFeature: string, enabled?: boolean): void {
    const featureConfig = features.get(debugFeature);
    if(featureConfig === undefined) {
        console.warn(`Unknown debug feature "${debugFeature}"; ignored`);
        return;
    }

    const [wasEnabled, _description] = featureConfig;

    if(enabled === undefined) {
        enabled = !wasEnabled;
    }

    if(wasEnabled !== enabled) {
        featureConfig[0] = enabled;
        console.info(`[lazy-widgets] ${enabled ? 'En' : 'Dis'}abled "${debugFeature}" debug feature`);

        if (featureConfig.length > 2) {
            (featureConfig[2] as ToggleCallback)(enabled);
        }
    }
}

/**
 * List all debug features in the console.
 *
 * @category Debug
 */
export function listDebugFeatures(): void {
    for(const [feature, featureConfig] of features) {
        console.info(`[lazy-widgets] "${feature}" (${featureConfig[0] ? 'en' : 'dis'}abled): ${featureConfig[1]}`);
    }
}

/**
 * Inject code for a new debug feature that watches when a class' property is
 * set to true and prints to the console.
 *
 * @param classObj - The class. Widget for example
 * @param flagKey - The key of the property to watch. "_layoutDirty" for example
 *
 * @category Debug
 */
export function injectWatchflagFeature(classObj: any, flagKey: string): void {
    const propertyPath = `${extractWidgetName(classObj)}.${flagKey}`;
    const featureName = `watchflag.${propertyPath}`;
    if(features.has(featureName)) {
        console.warn(`[lazy-widgets] Already injected debug feature with name ${featureName}; ignored`);
        return;
    }

    const featureNameStrace = `watchflag.${propertyPath}.strace`;
    if(features.has(featureNameStrace)) {
        console.warn(`[lazy-widgets] Already injected debug feature with name ${featureNameStrace}; ignored`);
        return;
    }

    const valueMap: WeakMap<any, boolean> = new WeakMap();
    Object.defineProperty(classObj.prototype, flagKey, {
        get() {
            return valueMap.get(this);
        },
        set(newValue) {
            if(isDebugFeatureEnabled(featureName)) {
                const oldVal = valueMap.get(this);
                if(!oldVal && newValue) {
                    const msg = `[lazy-widgets ${featureName}] ${extractWidgetName(this.constructor)}.${flagKey} set to true`;
                    if(isDebugFeatureEnabled(featureNameStrace)) {
                        console.groupCollapsed(msg);
                        console.trace();
                        console.groupEnd();
                    } else {
                        console.debug(msg);
                    }
                }
            }

            valueMap.set(this, newValue);
        },
    });

    features.set(featureName, [false, `Show when ${propertyPath} is set to true`]);
    features.set(featureNameStrace, [false, `Print stack trace when ${featureName} shows that a flag has been set`]);
}

/**
 * Inject code for a new debug feature that traces when a class' method is
 * called, if the class calls the same method for other objects (prints tree)
 * and how long each call took in milliseconds.
 *
 * @param classObj - The class. Widget for example
 * @param methodKey - The key of the property to watch. "paint" for example
 * @param messageGenerator - A function that returns a string with extra information about the function call. For example, a function which returns " (forced)" if Widget.paint is called with forced set to true
 *
 * @category Debug
 */
export function injectTraceFeature(classObj: any, methodKey: string, messageGenerator: ((...args: any[]) => string) | null = null): void {
    const methodPath = `${extractWidgetName(classObj)}.${methodKey}`;
    const featureName = `trace.${methodPath}`;
    if(features.has(featureName)) {
        console.warn(`[lazy-widgets] Already injected debug feature with name ${featureName}; ignored`);
        return;
    }

    const msgStack: Array<string> = [];
    const msgIndices: Map<any, number> = new Map();
    const methodOrig = classObj.prototype[methodKey];
    let traceLevel = 0;

    function logMsgStack(): void {
        if(traceLevel === 0) {
            if(isDebugFeatureEnabled(featureName)) {
                console.debug(`[lazy-widgets ${featureName}] Trace:\n${msgStack.join('\n')}`);
            }

            traceLevel = 0;
            msgStack.length = 0;
            msgIndices.clear();
        }
    }

    classObj.prototype[methodKey] = function(...args: any[]) {
        traceLevel++;
        let msgIndex = msgIndices.get(this);

        if(msgIndex === undefined) {
            msgIndex = msgStack.length;
            msgIndices.set(this, msgIndex);
            let prefix;
            if(traceLevel > 1) {
                prefix = '  '.repeat(traceLevel - 2) + '> ';
            } else {
                prefix = '';
            }

            msgStack.push(`${prefix}${extractWidgetName(this.constructor)}`);
        } else {
            msgStack[msgIndex] += ', recall';
        }

        if(messageGenerator !== null) {
            msgStack[msgIndex] += messageGenerator.apply(this, args);
        }

        const startTime = (new Date()).getTime();

        try {
            const returnVal = methodOrig.apply(this, args);
            msgStack[msgIndex] += ` <${(new Date()).getTime() - startTime} ms>`;
            return returnVal;
        } catch(e) {
            msgStack[msgIndex] += ' <exception thrown>';
            throw e;
        } finally {
            traceLevel--;
            logMsgStack();
        }
    }

    features.set(featureName, [false, `Trace ${methodPath} method calls`]);
}

/**
 * Inject code for a new debug feature that returns a random fill colour in a
 * given property when enabled.
 *
 * EPILEPSY WARNING: This debug feature may trigger epileptic seizures when
 * enabled, especially for widgets that frequently update.
 *
 * @param classObj - The class. BaseTheme for example
 * @param themePropertyKey - The key of the property to override. "canvasFill" for example
 *
 * @category Debug
 */
export function injectRandomFillFeature(classObj: any, themePropertyKey: string): void {
    const propertyPath = `${extractWidgetName(classObj)}.${themePropertyKey}`;
    const featureName = `randomfill.${propertyPath}`;
    if(features.has(featureName)) {
        console.warn(`[lazy-widgets] Already injected debug feature with name ${featureName}; ignored`);
        return;
    }

    const propertyOrig = Object.getOwnPropertyDescriptor(classObj.prototype, themePropertyKey);
    Object.defineProperty(classObj.prototype, themePropertyKey, {
        get() {
            if(isDebugFeatureEnabled(featureName)) {
                return '#' + Math.floor(Math.random() * 0xffffff).toString(16);
            } else if(propertyOrig?.get !== undefined) {
                return propertyOrig.get.apply(this);
            }
        },
        set(newValue) {
            if(propertyOrig?.set !== undefined) {
                propertyOrig.set.apply(this, [newValue]);
            }
        },
    });

    features.set(featureName, [false, `(EPILEPSY WARNING) Override the ${propertyPath} theme property with a new random colour every time the theme property's value is fetched. Useful for visualising widget painting`]);
}

/**
 * Inject code for a new debug feature that calls console.trace when a specific
 * method is called and this feature is enabled.
 *
 * @param classObj - The class. Widget for example
 * @param methodKey - The key of the property to watch. "paint" for example
 *
 * @category Debug
 */
export function injectStackTraceFeature(classObj: any, methodKey: string): void {
    const methodPath = `${extractWidgetName(classObj)}.${methodKey}`;
    const featureName = `stacktrace.${methodPath}`;
    if(features.has(featureName)) {
        console.warn(`[lazy-widgets] Already injected debug feature with name ${featureName}; ignored`);
        return;
    }

    const methodOrig = classObj.prototype[methodKey];
    classObj.prototype[methodKey] = function(...args: any[]) {
        if(isDebugFeatureEnabled(featureName)) {
            console.groupCollapsed(`[lazy-widgets ${featureName}] ${extractWidgetName(this.constructor)}.${methodKey} called`);
            console.trace();
            console.groupEnd();
        }

        return methodOrig.apply(this, args);
    }

    features.set(featureName, [false, `Print stack trace when ${methodPath} is called`]);
}

/**
 * Check if a given number is whole, given a minimum distance from the nearest
 * whole number. If sensitivity is 0, then the number must be an integer. If
 * not, the it can be near an integer and still count as whole.
 *
 * @internal
 */
function isWhole(val: number, sensitivity: number) {
    const clamped = Math.abs(val) % 1;
    if(clamped < sensitivity) {
        return true;
    } else if(clamped > 1 - sensitivity) {
        return true;
    } else {
        return false;
    }
}

let injected = false;

/**
 * Inject all default debug code. Call this before doing anything if you want to
 * enable debugging. Has no effect when called more than once.
 *
 * @category Debug
 */
export function injectDebugCode(): void {
    if(injected) {
        console.warn('[lazy-widgets] Already injected debug code; ignored');
        return;
    }

    injected = true;

    // trace.Widget.paint
    injectTraceFeature(Widget, 'paint', (forced) => {
        return forced ? ' (forced)' : '';
    });
    // trace.Widget.resolveDimensions
    injectTraceFeature(Widget, 'resolveDimensions', (minWidth, maxWidth, minHeight, maxHeight) => {
        return ` (${minWidth}, ${maxWidth}, ${minHeight}, ${maxHeight})`;
    });
    // trace.Widget.resolvePosition
    injectTraceFeature(Widget, 'resolvePosition', (x, y) => {
        return ` (${x}, ${y})`;
    });
    // trace.Widget.dispatchEvent
    injectTraceFeature(Widget, 'dispatchEvent', (event) => {
        return ` (${event.type})`;
    });
    // stacktrace.Root.resolveLayout
    injectStackTraceFeature(Root, 'resolveLayout');
    // stacktrace.Root.paint
    injectStackTraceFeature(Root, 'paint');
    // stacktrace.Root.dispatchEvent
    injectStackTraceFeature(Root, 'dispatchEvent');
    // stacktrace.Root.preLayoutUpdate
    injectStackTraceFeature(Root, 'preLayoutUpdate');
    // stacktrace.Root.postLayoutUpdate
    injectStackTraceFeature(Root, 'postLayoutUpdate');
    // stacktrace.Root.requestPointerStyle
    injectStackTraceFeature(Root, 'requestPointerStyle');
    // stacktrace.Root.clearPointerStyle
    injectStackTraceFeature(Root, 'clearPointerStyle');
    // stacktrace.Root.clearPointerStylesFromWidget
    injectStackTraceFeature(Root, 'clearPointerStylesFromWidget');
    // stacktrace.Root.requestFocus
    injectStackTraceFeature(Root, 'requestFocus');
    // stacktrace.Root.dropFocus
    injectStackTraceFeature(Root, 'dropFocus');
    // stacktrace.Root.clearFocus
    injectStackTraceFeature(Root, 'clearFocus');
    // stacktrace.Root.getFocus
    injectStackTraceFeature(Root, 'getFocus');
    // stacktrace.Root.getFocusCapturer
    injectStackTraceFeature(Root, 'getFocusCapturer');
    // stacktrace.Root.registerDriver
    injectStackTraceFeature(Root, 'registerDriver');
    // stacktrace.Root.unregisterDriver
    injectStackTraceFeature(Root, 'unregisterDriver');
    // stacktrace.Root.clearDrivers
    injectStackTraceFeature(Root, 'clearDrivers');
    // stacktrace.Root.getTextInput
    injectStackTraceFeature(Root, 'getTextInput');
    // stacktrace.Widget.dispatchEvent
    injectStackTraceFeature(Widget, 'dispatchEvent');
    // stacktrace.Widget.preLayoutUpdate
    injectStackTraceFeature(Widget, 'preLayoutUpdate');
    // stacktrace.Widget.resolveDimensions
    injectStackTraceFeature(Widget, 'resolveDimensions');
    // stacktrace.Widget.resolvePosition
    injectStackTraceFeature(Widget, 'resolvePosition');
    // stacktrace.Widget.postLayoutUpdate
    injectStackTraceFeature(Widget, 'postLayoutUpdate');
    // stacktrace.Widget.paint
    injectStackTraceFeature(Widget, 'paint');
    // stacktrace.Widget.propagateDirtyRect
    injectStackTraceFeature(Widget, 'propagateDirtyRect');
    // randomfill.BaseTheme.canvasFill
    injectRandomFillFeature(BaseTheme, 'canvasFill');
    // randomfill.BaseTheme.primaryFill
    injectRandomFillFeature(BaseTheme, 'primaryFill');
    // randomfill.BaseTheme.accentFill
    injectRandomFillFeature(BaseTheme, 'accentFill');
    // randomfill.BaseTheme.backgroundFill
    injectRandomFillFeature(BaseTheme, 'backgroundFill');
    // randomfill.BaseTheme.backgroundGlowFill
    injectRandomFillFeature(BaseTheme, 'backgroundGlowFill');
    // randomfill.BaseTheme.bodyTextFill
    injectRandomFillFeature(BaseTheme, 'bodyTextFill');
    // randomfill.BaseTheme.inputBackgroundFill
    injectRandomFillFeature(BaseTheme, 'inputBackgroundFill');
    // randomfill.BaseTheme.inputSelectBackgroundFill
    injectRandomFillFeature(BaseTheme, 'inputSelectBackgroundFill');
    // randomfill.BaseTheme.inputTextFill
    injectRandomFillFeature(BaseTheme, 'inputTextFill');
    // randomfill.BaseTheme.inputTextFillDisabled
    injectRandomFillFeature(BaseTheme, 'inputTextFillDisabled');
    // randomfill.BaseTheme.inputTextFillInvalid
    injectRandomFillFeature(BaseTheme, 'inputTextFillInvalid');

    // textrendergroups; special debug feature for TextRenderGroup
    features.set(
        'textrendergroups',
        [
            false,
            `Draw text render groups in a TextHelper with alternating background colours (green and red). Width overriding groups have a blue background and zero-width groups have a black background. Throws an exception on negative width groups`,
        ]
    );

    const textHelperAlternate: WeakMap<TextHelper, boolean> = new Map();
    const textHelperPaintOrig = TextHelper.prototype.paint;
    TextHelper.prototype.paint = function(ctx: CanvasRenderingContext2D, fillStyle: FillStyle, x: number, y: number): void {
        textHelperAlternate.set(this, false);
        textHelperPaintOrig.apply(this, [ctx, fillStyle, x, y]);
    };

    const textHelperPaintGroupOrig = TextHelper.prototype.paintGroup;
    TextHelper.prototype.paintGroup = function(ctx: CanvasRenderingContext2D, group: TextRenderGroup, left: number, x: number, y: number): void {
        if(isDebugFeatureEnabled('textrendergroups')) {
            const origFillStyle = ctx.fillStyle;
            const height = this.actualLineHeight;
            const fullHeight = this.fullLineHeight;
            if(!group.overridesWidth && group.right > left) {
                const alternate = textHelperAlternate.get(this);
                ctx.fillStyle = alternate ? 'rgba(255, 0, 0, 0.5)'
                    : 'rgba(0, 255, 0, 0.5)';
                ctx.fillRect(x, y - height, group.right - left, fullHeight);
                textHelperAlternate.set(this, !alternate);
            } else {
                let debugWidth = group.right - left;
                ctx.fillStyle = debugWidth > 0 ? 'rgba(0, 0, 255, 0.5)'
                    : 'rgba(0, 0, 0, 0.5)';
                if(debugWidth == 0) {
                    debugWidth = 4;
                } else if(debugWidth < 0) {
                    throw new Error(Msg.NEGATIVE_TEXT_GROUP);
                }

                ctx.fillRect(x, y - height, debugWidth, fullHeight);
            }

            ctx.fillStyle = origFillStyle;
        }

        textHelperPaintGroupOrig.apply(this, [ctx, group, left, x, y]);
    };

    // warnsubpixels; special debug feature for Widget
    features.set(
        'warnsubpixels',
        [
            false,
            `Print a console warning whenever a Widget is detected to have non-integer width, height, x or y. Only warned once per Widget type`,
        ]
    );

    const warnedSubX: Set<string> = new Set();
    const warnedSubY: Set<string> = new Set();
    const warnedSubWidth: Set<string> = new Set();
    const warnedSubHeight: Set<string> = new Set();
    const msgLeft = '[lazy-widgets warnsubpixels] Widget type "';
    const msgMid = '" has a non-integer ';
    const msgRight = ', which will create clipping issues due to subpixels. This message won\'t be shown again for this widget type';

    const finalizeBoundsOrig = Widget.prototype.finalizeBounds;
    Widget.prototype.finalizeBounds = function(): void {
        finalizeBoundsOrig.apply(this);
        const typeName = extractWidgetName(this.constructor);

        if(isDebugFeatureEnabled('warnsubpixels')) {
            const [scaleX, scaleY] = this.root.effectiveScale;
            const [x, y] = this.position;
            if(!isWhole(x * scaleX, 1e-10) && !warnedSubX.has(typeName)) {
                warnedSubX.add(typeName);
                console.warn(`${msgLeft}${typeName}${msgMid}X coordinate (${x})${msgRight}`);
            }

            if(!isWhole(y * scaleY, 1e-10) && !warnedSubY.has(typeName)) {
                warnedSubY.add(typeName);
                console.warn(`${msgLeft}${typeName}${msgMid}Y coordinate (${y})${msgRight}`);
            }

            const [width, height] = this.dimensions;
            if(!isWhole(width * scaleX, 1e-10) && !warnedSubWidth.has(typeName)) {
                warnedSubWidth.add(typeName);
                console.warn(`${msgLeft}${typeName}${msgMid}width (${width})${msgRight}`);
            }

            if(!isWhole(height * scaleY, 1e-10) && !warnedSubHeight.has(typeName)) {
                warnedSubHeight.add(typeName);
                console.warn(`${msgLeft}${typeName}${msgMid}height (${height})${msgRight}`);
            }
        }
    };

    // flashdamage; special debug feature for CanvasViewport
    const viewports: Array<DebuggableCanvasViewport> = [];
    features.set(
        'flashdamage',
        [
            false,
            'Debug damage regions; momentarily flash rectangles that are marked as dirty for 1 second. Pushed dirty rectangles are painted in red, while merged (effective) dirty rectangles are painted in blue',
            (enabled) => {
                for (const viewport of viewports) {
                    viewport.overlayEnabled = enabled;
                }
            }
        ]
    );

    Root.makeViewport = function(child: Widget, properties?: Readonly<RootProperties>): CanvasViewport {
        const viewport = new DebuggableCanvasViewport(child, properties?.resolution, properties?.preventBleeding, properties?.preventAtlasBleeding, properties?.canvasStartingWidth, properties?.canvasStartingHeight);
        viewports.push(viewport);

        if (isDebugFeatureEnabled('flashdamage')) {
            viewport.overlayEnabled = true;
        }

        return viewport;
    };

    Object.defineProperty(Root.prototype, 'canvas', {
        get() {
            return this.viewport.outputCanvas;
        },
    });

    // Make debug functions available in global scope
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).canvasDebug = {
        enabled: isDebugFeatureEnabled,
        toggle: toggleDebugFeature,
        list: listDebugFeatures,
    };

    console.info('[lazy-widgets] Injected debug code; the library will be slower');
    console.info('[lazy-widgets] Check if a debug feature is enabled in the console with canvasDebug.enabled(debugFeature: string)');
    console.info('[lazy-widgets] Enable a debug feature in the console with canvasDebug.toggle(debugFeature: string, enabled?: boolean)');
    console.info('[lazy-widgets] List debug features in the console with canvasDebug.list()');
}

/**
 * Extract a human-readable name from a Widget class
 * @internal
 */
function extractWidgetName(classObj: any) {
    if (classObj.autoXML && ('name' in classObj.autoXML)) {
        return classObj.autoXML.name;
    } else {
        return classObj.name;
    }
}
