import { Layer } from '../core/Layer';
import type { LayerInit } from '../core/LayerInit';
import type { Root } from '../core/Root';
import type { Viewport } from '../core/Viewport';
import type { Event } from '../events/Event';
import type { Rect } from '../helpers/Rect';
import { Parent } from './Parent';
import type { Widget, WidgetProperties } from './Widget';

type LayerIteratorNextType<W extends Widget> = [layer: Layer<W>, layerName: string | null];

function makeLayerIterator<W extends Widget>(startIndex: number, delta: number, layers: Array<Layer<W>>, layerNames: Map<string, number>) {
    const names = new Map<number, string>();

    for (const [name, nameIndex] of layerNames) {
        names.set(nameIndex, name);
    }

    let index = startIndex;

    return <Iterator<LayerIteratorNextType<W>>>{
        next() {
            if (index >= layers.length || index < 0) {
                return { value: undefined, done: true };
            } else {
                const layer = layers[index];
                const name = names.get(index) ?? null;
                index += delta;

                return { value: [layer, name], done: false };
            }
        }
    }
}

export class LayeredContainer<W extends Widget = Widget> extends Parent<W> {
    readonly defaultLayer: Layer<W>;
    private _defaultLayerIndex;
    private readonly layers = new Array<Layer<W>>();
    private readonly layerNames = new Map<string, number>();

    constructor(defaultLayerIndex: number, layersInit: Array<LayerInit<W>>, properties?: Readonly<WidgetProperties>) {
        super(true, properties);

        const layerCount = layersInit.length;

        if (defaultLayerIndex < 0) {
            defaultLayerIndex += layerCount;
        }

        if (defaultLayerIndex < 0 || defaultLayerIndex >= layerCount) {
            throw new Error('Default layer index is out of bounds');
        }

        for (const layerInit of layersInit) {
            const canExpand = layerInit.canExpand ?? true;
            const name = layerInit.name ?? null;
            const child = layerInit.child;

            if (!child) {
                throw new Error('A layer must have a child widget');
            }

            if (name !== null) {
                this.layerNames.set(name, this.layers.length);
            }

            this.layers.push(<Layer<W>>{ child, canExpand });
        }

        this._defaultLayerIndex = defaultLayerIndex;
        this.defaultLayer = this.layers[defaultLayerIndex];

        if (!this.defaultLayer.canExpand) {
            throw new Error('Default layer must be able to expand the layout');
        }
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
        for (const [layer, _name] of this.backToFrontLayers) {
            yield layer.child;
        }
    }

    override get childCount(): number {
        return this.layerCount;
    }

    get layerCount() {
        return this.layers.length;
    }

    get defaultLayerIndex() {
        return this._defaultLayerIndex;
    }

    get backToFrontLayers(): Iterable<LayerIteratorNextType<W>> {
        const layers = this.layers;
        const layerNames = this.layerNames;

        return {
            [Symbol.iterator]() {
                return makeLayerIterator(0, 1, layers, layerNames);
            }
        }
    }

    get frontToBackLayers(): Iterable<LayerIteratorNextType<W>> {
        const layers = this.layers;
        const layerNames = this.layerNames;

        return {
            [Symbol.iterator]() {
                return makeLayerIterator(layers.length - 1, -1, layers, layerNames);
            }
        }
    }

    protected override handleEvent(event: Event): Widget | null {
        // Dispatch event to children. Front layers receive the event before the
        // back layers
        for (const [layer, _name] of this.frontToBackLayers) {
            const capturer = layer.child.dispatchEvent(event);
            if (capturer) {
                return capturer;
            }
        }

        return null;
    }

    protected override handlePreLayoutUpdate(): void {
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

        for (const [layer, _name] of this.backToFrontLayers) {
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

    pushLayer(layer: Layer<W>, name: string | null = null): number {
        const index = this.layers.push(layer) - 1;

        if (name !== null) {
            this.layerNames.set(name, index);
        }

        this.attachLayer(layer);
        return index;
    }

    insertLayerBefore(layer: Layer<W>, index: number, name: string | null = null): number {
        const layerCount = this.layers.length;

        if (index < 0) {
            index = layerCount + index;
            if (index < 0) {
                index = 0;
            }
        } else if (index >= layerCount) {
            return this.pushLayer(layer, name);
        }

        this.updateIndices(index, 1);
        this.layers.splice(index, 0, layer);

        if (name !== null) {
            this.layerNames.set(name, index);
        }

        this.attachLayer(layer);
        return index;
    }

    insertLayerAfter(layer: Layer<W>, index: number, name: string | null = null): number {
        return this.insertLayerBefore(layer, index + 1, name);
    }

    removeLayer(index: number) {
        const layerCount = this.layers.length;

        if (index < 0) {
            index = layerCount + index;
        }

        if (index < 0 || index >= layerCount) {
            throw new RangeError('Cannot remove layer: index out of bounds');
        }

        if (index === this._defaultLayerIndex) {
            throw new Error('Default layer connot be removed');
        }

        this.detachLayer(this.layers[index]);
        this.layers.splice(index, 1);
        this.updateIndices(index, -1);
    }

    getNamedLayerIndex(name: string): number | null {
        const index = this.layerNames.get(name);

        if (index !== undefined) {
            return index;
        } else {
            return null;
        }
    }

    getNamedLayer(name: string): Layer<W> | null {
        const index = this.layerNames.get(name);

        if (index !== undefined) {
            return this.layers[index];
        } else {
            return null;
        }
    }

    getLayerIndex(layer: Layer<W>): number | null {
        const index = this.layers.indexOf(layer);
        return (index < 0) ? null : index;
    }

    private updateIndices(indexMin: number, delta: number) {
        // XXX is this safe? i've read that it is, but it doesn't feel right
        for (const [name, index] of this.layerNames) {
            if (index >= indexMin) {
                this.layerNames.set(name, index + delta);
            }
        }

        if (this._defaultLayerIndex >= indexMin) {
            this._defaultLayerIndex += delta;
        }
    }

    private attachLayer(layer: Layer<W>) {
        if (this.attached) {
            layer.child.attach(this._root as Root, this._viewport as Viewport, this);
        }

        this._layoutDirty = true;
    }

    private detachLayer(layer: Layer<W>) {
        if (this.attached) {
            const child = layer.child;
            this.markAsDirty([...child.position, ...child.dimensions]);
            child.detach();
        }

        this._layoutDirty = true;
    }
}
