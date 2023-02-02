import { LayerContext } from '../core/LayerContext';
import type { LayerInit } from '../core/LayerInit';
import type { Event } from '../events/Event';
import type { Rect } from '../helpers/Rect';
import { Parent } from './Parent';
import type { Widget, WidgetProperties } from './Widget';

export class LayeredContainer<W extends Widget = Widget> extends Parent<W> {
    readonly layerContext: LayerContext<W>;

    constructor(defaultLayerIndex: number, layersInit: Array<LayerInit<W>>, properties?: Readonly<WidgetProperties>) {
        super(true, properties);

        this.layerContext = new LayerContext(defaultLayerIndex, layersInit);
    }

    static fromDefaultLayerChild<W extends Widget>(defaultLayerChild: W, properties?: Readonly<WidgetProperties>) {
        return new LayeredContainer(0, [
            <LayerInit<W>>{
                child: defaultLayerChild,
                canExpand: true
            }
        ], properties);
    }

    override *[Symbol.iterator](): Iterator<W> {
        for (const [layer, _name] of this.layerContext) {
            yield layer.child;
        }
    }

    override get childCount(): number {
        return this.layerContext.layerCount;
    }

    get frontToBackLayers() {
        return this.layerContext.frontToBack;
    }

    get backToFrontLayers() {
        return this.layerContext.backToFront;
    }

    protected override handleEvent(event: Event): Widget | null {
        // Dispatch event to children. Front layers receive the event before the
        // back layers
        for (const [layer, _name] of this.layerContext.frontToBack) {
            const capturer = layer.child.dispatchEvent(event);
            if (capturer) {
                return capturer;
            }
        }

        return null;
    }

    protected override handlePreLayoutUpdate(): void {
        // Mark layout as dirty if the layer context is dirty
        if (this.layerContext.layersDirty) {
            this.layerContext.layersDirty = false;
            this._layoutDirty = true;
        }

        // Pre-layout update all children. Propagate layoutDirty flag
        for (const child of this) {
            child.preLayoutUpdate();

            // If child's layout is dirty, set self's layout as dirty
            if(child.layoutDirty) {
                this._layoutDirty = true;
            }
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update all children
        for (const child of this) {
            child.postLayoutUpdate();
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Resolve child's dimensions and set own resolved dimensions to be
        // equal to the maximum dimensions of layers which can expand
        this.idealWidth = 0;
        this.idealHeight = 0;

        for (const [layer, _name] of this.layerContext) {
            const child = layer.child;
            child.resolveDimensions(minWidth, maxWidth, minHeight, maxHeight);

            if (layer.canExpand) {
                const [idealChildWidth, idealChildHeight] = child.idealDimensions;
                this.idealWidth = Math.max(this.idealWidth, idealChildWidth);
                this.idealHeight = Math.max(this.idealHeight, idealChildHeight);
            }
        }
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);

        // Resolve children's position to be the same as this widget's position
        for (const child of this) {
            child.resolvePosition(x, y);
        }
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint children. Back layers are painted before front layers
        for (const [layer, _name] of this.backToFrontLayers) {
            layer.child.paint(dirtyRects);
        }
    }
}
