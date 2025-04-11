import { expect } from 'chai';
import { Root, Row, Spacing, type Widget, WidgetProperties } from '../../src/index.js';

type TestElement = [
    widget: Widget,
    test: (i: number, widget: Widget, row: Row) => unknown,
];

function setupTestRoot(elements: TestElement[], properties?: Readonly<WidgetProperties>) {
    const row = new Row<Widget>([], properties);
    for (const elem of elements) {
        row.add(elem[0]);
    }

    const root = new Root(row);
    root.preLayoutUpdate();
    root.resolveLayout();

    for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        elem[1](i, elem[0], row);
    }

    return row;
}

function basicSpacing(minWidth: number, maxWidth = Infinity, flex = 0, flexShrink = 0, flexBasis: number | null = null, expectedWidth?: number | null, delta = 0): TestElement {
    if (expectedWidth === undefined) {
        expectedWidth = minWidth;
    }

    return [
        new Spacing({ flex, flexShrink, flexBasis, minWidth, maxWidth }),
        (i, widget) => {
            if (expectedWidth !== null) {
                expect(widget.dimensions[0], `Widget at index ${i}`).approximately(expectedWidth, delta);
            }
        }
    ];
}

describe('MultiContainer tests', () => {
    it('Basic layouts have the right sizes', () => {
        const row = setupTestRoot([
            basicSpacing(200),
            basicSpacing(100),
            basicSpacing(200),
        ], {
            multiContainerSpacing: 10,
        });

        expect(row.dimensions[0]).to.equal(520);
    });

    it('Flex has no effect when unconstrained', () => {
        const row = setupTestRoot([
            basicSpacing(200, Infinity, 10),
            basicSpacing(100, Infinity, 5),
            basicSpacing(200, Infinity, 1),
        ], {
            multiContainerSpacing: 10,
        });

        expect(row.dimensions[0]).to.equal(520);
    });

    it('Flex distributes space correctly when constrained', () => {
        const row = setupTestRoot([
            basicSpacing(200, Infinity, 1, 0, 0, 250),
            basicSpacing(100, Infinity, 2, 0, 0, 500),
            basicSpacing(200, Infinity, 1, 0, 0, 250),
        ], {
            multiContainerSpacing: 10,
            minWidth: 1020,
        });

        expect(row.dimensions[0]).to.equal(1020);
    });

    it('Flex distributes space correctly when constrained and respects minimum element length', () => {
        const row = setupTestRoot([
            basicSpacing(300, Infinity, 1, 0, 0, 300),
            basicSpacing(200, Infinity, 2, 0, 0, 400),
            basicSpacing(300, Infinity, 1, 0, 0, 300),
        ], {
            multiContainerSpacing: 10,
            minWidth: 1020,
        });

        expect(row.dimensions[0]).to.equal(1020);
    });

    it('Flex distributes space correctly when constrained and respects maximum element length', () => {
        const row = setupTestRoot([
            basicSpacing(300, Infinity, 1, 0, 0, 333.333, 1),
            basicSpacing(200, 333, 2, 0, 0, 333.333, 1),
            basicSpacing(300, Infinity, 1, 0, 0, 333.333, 1),
        ], {
            multiContainerSpacing: 10,
            minWidth: 1020,
        });

        expect(row.dimensions[0]).to.equal(1020);
    });

    it('Flex shrinks space correctly when constrained', () => {
        const elems = [
            basicSpacing(0, Infinity, 0, 1, 500, null),
            basicSpacing(0, Infinity, 0, 2, 500, null),
            basicSpacing(0, Infinity, 0, 1, 500, null),
        ];

        const row = setupTestRoot(elems, {
            multiContainerSpacing: 10,
            maxWidth: 1020,
        });

        expect(elems[0][0].dimensions[0]).to.equal(elems[2][0].dimensions[0]);
        expect(elems[1][0].dimensions[0]).to.be.lessThan(elems[0][0].dimensions[0]);
        expect(elems[0][0].dimensions[0] + elems[1][0].dimensions[0] + elems[2][0].dimensions[0] + 20).to.equal(row.dimensions[0]);
        expect(row.dimensions[0]).to.equal(1020);
    });

    it('Flex shrinks space correctly when constrained and respects minimum element length', () => {
        const elems = [
            basicSpacing(0, Infinity, 0, 1, 1000, null),
            basicSpacing(500, Infinity, 0, 1, 1000),
            basicSpacing(0, Infinity, 0, 1, 1000, null),
        ];

        const row = setupTestRoot(elems, {
            multiContainerSpacing: 10,
            maxWidth: 1020,
        });

        expect(elems[0][0].dimensions[0]).to.equal(elems[2][0].dimensions[0]);
        expect(elems[0][0].dimensions[0] + elems[1][0].dimensions[0] + elems[2][0].dimensions[0] + 20).to.equal(row.dimensions[0]);
        expect(row.dimensions[0]).to.equal(1020);
    });
});
