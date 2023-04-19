export abstract class XMLUIParserNode {
    static readonly type: string;
    abstract readonly type: string;
    static readonly typeGroup: string | null;
    abstract readonly typeGroup: string | null;

    parent: XMLUIParserNode | null = null;
    children = new Array<XMLUIParserNode>();

    // abstract validate(errors: Array<Error>): boolean; // TODO dont use error objects

    // TODO serialize method

    removeChild(node: XMLUIParserNode): boolean {
        const idx = this.children.indexOf(node);
        if (idx !== -1) {
            this.children.splice(idx, 1);
            node.parent = null;
            return true;
        } else {
            return false;
        }
    }

    addChild(node: XMLUIParserNode): void {
        if (node.parent === this) {
            return;
        }

        node.detach();
        this.children.push(node);
        node.parent = this;
    }

    detach(): void {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    attach(parent: XMLUIParserNode) {
        parent.addChild(this);
    }

    isa<N extends XMLUIParserNode>(clazz: ({ new (..._args: never[]): N, type: string }) ): this is N {
        return clazz.type === this.type;
    }
}
