import { Widget } from '../widgets/Widget';

export interface LayerInit<W extends Widget> {
    child: W;
    name?: string;
    canExpand?: boolean;
}
