import { Widget } from '../widgets/Widget';

export type Layer<W extends Widget> = {
    child: W;
    canExpand: boolean;
}
