/**
 * Context for a {@link ConcurrentCollection} being iterated.
 *
 * @internal
 */
export interface ConcurrentCollectionIterator {
    nextIndex: number;
}

/**
 * A special collection type that can be modified while being iterated. Useful
 * for implementing event listener lists.
 *
 * Can only add at the end of the collection, but can remove from anywhere in
 * the collection (while iterating). Preserves insertion order.
 */
export class ConcurrentCollection<V> {
    private readonly iterators = new Set<ConcurrentCollectionIterator>();
    private readonly values: V[] = [];

    indexOf(value: V): number {
        return this.values.indexOf(value);
    }

    forEach(callback: (value: V) => void) {
        const iterator = <ConcurrentCollectionIterator>{ nextIndex: 0 };
        this.iterators.add(iterator);
        try {
            while (iterator.nextIndex < this.size) {
                callback(this.values[iterator.nextIndex++]);
            }
        } finally {
            this.iterators.delete(iterator);
        }
    }

    add(value: V): number {
        return this.values.push(value) - 1;
    }

    remove(index: number): boolean {
        const removed = this.values.splice(index, 1).length > 0;

        for (const iterator of this.iterators) {
            if (iterator.nextIndex < index) {
                iterator.nextIndex--;
            }
        }

        return removed;
    }

    removeByValue(value: V): boolean {
        const index = this.indexOf(value);
        if (index < 0) {
            return false;
        }

        this.values.splice(index, 1);

        for (const iterator of this.iterators) {
            if (iterator.nextIndex < index) {
                iterator.nextIndex--;
            }
        }

        return true;
    }

    get size(): number {
        return this.values.length;
    }
}
