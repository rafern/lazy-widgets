/**
 * Efficiently inserts a value from an ordered superset into a subset, with the
 * same order. Note that the subset parameter MUST be a subset of the superset
 * parameter.
 */
export function insertValueIntoOrderedSubsetList<V>(val: V, subset: Array<V>, superset: Array<V>) {
    // XXX `subset` is a subset of `superset` with the same order. this
    // efficiently inserts an element into the subset, while keeping the same
    // order as the superset
    const rootsIndex = superset.indexOf(val);
    if (rootsIndex < 0) {
        throw new Error("Value not found in superset; this is a bug, please report it");
    }

    // TODO quadruple-check that this algorithm is correct. it seems to work,
    //      but i'm not 100% confident in it
    let lastFound = -1;
    const subsetCount = subset.length;
    for (let i = 0; i < subsetCount; i++) {
        // get index of this subset value in the superset
        const otherRoot = subset[i];
        if (otherRoot === val) {
            throw new Error('Value is already in subset; this is a bug, please report it');
        }

        lastFound = superset.indexOf(otherRoot, lastFound + 1);

        // if the superset index is after the inserted value's superset index,
        // insert in-place
        if (rootsIndex < lastFound) {
            subset.splice(i, 0, val);
            return;
        }
    }

    // no insertion spot found, meaning that the inserted value needs to be
    // placed after all the subset values. push to the end
    subset.push(val);
}
