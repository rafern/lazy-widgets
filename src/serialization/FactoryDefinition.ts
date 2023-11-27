import { WidgetXMLInputConfig, XMLWidgetFactory } from '../index.js';

export type FactoryDefinition = [ inputMapping: WidgetXMLInputConfig, factory: XMLWidgetFactory, paramNames: Map<string, number>, paramValidators: Map<number, (inputValue: unknown) => unknown> ];
