import { Widget } from '../widgets/Widget';
import { Layer } from './Layer';

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
    private _defaultLayerIndex = 0;
    private readonly layers: Array<Layer<W>>;
    private readonly layerNames = new Map<string, number>();
    private _layersDirty = true;

    constructor(defaultLayerChild: W) {
        this.defaultLayer = <Layer<W>>{
            child: defaultLayerChild,
            canExpand: true
        };

        this.layers = [this.defaultLayer];
    }

    get defaultLayerIndex() {
        return this._defaultLayerIndex;
    }

    get layersDirty() {
        return this._layersDirty;
    }

    [Symbol.iterator]() {
        return makeLayerIterator(0, 1, this.layers, this.layerNames);
    }

    get inReverse(): Iterable<LayerIteratorNextType<W>> {
        const layers = this.layers;
        const layerNames = this.layerNames;

        return {
            [Symbol.iterator]() {
                return makeLayerIterator(0, 1, layers, layerNames);
            }
        }
    }

    pushLayer(layer: Layer<W>, name: string | null = null): number {
        const index = this.layers.push(layer) - 1;

        if (name !== null) {
            this.layerNames.set(name, index);
        }

        this._layersDirty = true;
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

        this._layersDirty = true;
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
