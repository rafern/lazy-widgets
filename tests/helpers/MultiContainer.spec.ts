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

function basicSpacing(minWidth: number, flex = 0, flexShrink = 0, flexBasis = 0, expectedWidth?: number, delta = 0): TestElement {
    if (expectedWidth === undefined) {
        expectedWidth = minWidth;
    }

    return [
        new Spacing({ flex, flexShrink, flexBasis, minWidth }),
        (i, widget) => expect(widget.dimensions[0], `Widget at index ${i}`).approximately(expectedWidth, delta),
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
            basicSpacing(200, 10),
            basicSpacing(100, 5),
            basicSpacing(200, 1),
        ], {
            multiContainerSpacing: 10,
        });

        expect(row.dimensions[0]).to.equal(520);
    });

    it('Flex distributes space correctly when constrained', () => {
        const row = setupTestRoot([
            basicSpacing(200, 1, 0, 0, 325),
            basicSpacing(100, 2, 0, 0, 350),
            basicSpacing(200, 1, 0, 0, 325),
        ], {
            multiContainerSpacing: 10,
            minWidth: 1020,
        });

        expect(row.dimensions[0]).to.equal(1020);
    });

    it('Flex shrinks space correctly when constrained', () => {
        const row = setupTestRoot([
            basicSpacing(0, 0, 1, 2000, 325),
            basicSpacing(0, 0, 2, 1000, 350),
            basicSpacing(0, 0, 1, 2000, 325),
        ], {
            multiContainerSpacing: 10,
            maxWidth: 1020,
        });

        expect(row.dimensions[0]).to.equal(1020);
    });
});
