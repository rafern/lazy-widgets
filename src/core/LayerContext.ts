import { Widget } from '../widgets/Widget';
import { Layer } from './Layer';
import type { LayerInit } from './LayerInit';

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

export class LayerContext<W extends Widget> implements Iterable<LayerIteratorNextType<W>> {
    readonly defaultLayer: Layer<W>;
    private _defaultLayerIndex;
    private readonly layers = new Array<Layer<W>>();
    private readonly layerNames = new Map<string, number>();
    layersDirty = true;

    constructor(defaultLayerIndex: number, layersInit: Array<LayerInit<W>>) {
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

    static fromDefaultLayerChild<W extends Widget>(defaultLayerChild: W) {
        return new LayerContext(0, [
            <Layer<W>>{
                child: defaultLayerChild,
                canExpand: true
            }
        ]);
    }

    get layerCount() {
        return this.layers.length;
    }

    get defaultLayerIndex() {
        return this._defaultLayerIndex;
    }

    [Symbol.iterator]() {
        return makeLayerIterator(0, 1, this.layers, this.layerNames);
    }

    get backToFront(): Iterable<LayerIteratorNextType<W>> {
        const layers = this.layers;
        const layerNames = this.layerNames;

        return {
            [Symbol.iterator]() {
                return makeLayerIterator(0, 1, layers, layerNames);
            }
        }
    }

    get frontToBack(): Iterable<LayerIteratorNextType<W>> {
        const layers = this.layers;
        const layerNames = this.layerNames;

        return {
            [Symbol.iterator]() {
                return makeLayerIterator(layers.length - 1, -1, layers, layerNames);
            }
        }
    }

    pushLayer(layer: Layer<W>, name: string | null = null): number {
        const index = this.layers.push(layer) - 1;

        if (name !== null) {
            this.layerNames.set(name, index);
        }

        this.layersDirty = true;
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

        this.layersDirty = true;
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

        this.layers.splice(index, 1);
        this.updateIndices(index, -1);
        this.layersDirty = true;
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
}
