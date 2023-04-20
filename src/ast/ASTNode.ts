export abstract class ASTNode {
    static readonly type: string;
    abstract readonly type: string;
    static readonly typeGroup: string | null;
    abstract readonly typeGroup: string | null;

    parent: ASTNode | null = null;
    children = new Array<ASTNode>();

    // abstract validate(errors: Array<Error>): boolean; // TODO dont use error objects

    // TODO serialize method

    removeChild(node: ASTNode): boolean {
        const idx = this.children.indexOf(node);
        if (idx !== -1) {
            this.children.splice(idx, 1);
            node.parent = null;
            return true;
        } else {
            return false;
        }
    }

    addChild(node: ASTNode): void {
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

    attach(parent: ASTNode) {
        parent.addChild(this);
    }

    isa<N extends ASTNode>(clazz: ({ new (..._args: never[]): N, type: string }) ): this is N {
        return clazz.type === this.type;
    }
}
