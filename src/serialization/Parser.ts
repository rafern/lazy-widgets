export class Parser {
    /**
     * Register a widget factory to an element name, with a given input mapping.
     *
     * @param nameOrWidgetClass - The camelCase or PascalCase name of the widget, which will be converted to kebab-case and be used as the element name for the widget. If a widget class is passed, then the class name will be used and converted to kebab-case.
     * @param inputMapping - The input mapping for the widget factory
     * @param factory - A function which creates a new instance of a widget
     */
    registerFactory<T extends Widget = Widget>(nameOrWidgetClass: string | (new (...args: unknown[]) => T), inputMapping: WidgetXMLInputConfig, factory: XMLWidgetFactory) {
        // handle constructors as names
        let factoryName = nameOrWidgetClass;
        if (typeof factoryName !== 'string') {
            factoryName = factoryName.name;
        }

        // make sure name is in kebab-case; element names are case-insensitive,
        // but just toLowerCase'ing it makes the tag names unreadable if the
        // string originally in camelCase or PascalCase
        factoryName = toKebabCase(factoryName);

        // make sure the name is not reserved/taken
        if (RESERVED_ELEMENT_NAMES.indexOf(factoryName) >= 0) {
            throw new Error(`The factory name "${factoryName}" is reserved`);
        }
        if (this.factories.has(factoryName)) {
            throw new Error(`The factory name "${factoryName}" is already taken by another factory`);
        }
        if (this.elementDeserializers.has(factoryName)) {
            throw new Error(`The factory name "${factoryName}" is already taken by an element deserializer`);
        }

        // validate parameter config and build parameter name map
        let hasTextNodeParam = false;
        const traps = new Set<string>();
        const paramValidators = new Map<number, (inputValue: unknown) => unknown>();
        const paramNames = new Map<string, number>();
        const paramCount = inputMapping.length;

        for (let i = 0; i < paramCount; i++) {
            const paramGeneric = inputMapping[i];

            if (paramGeneric.mode === 'value') {
                const param = paramGeneric as WidgetXMLInputConfigValueParameter;

                if (param.validator !== undefined) {
                    let validators: Array<WidgetAutoXMLConfigValidator | string>;

                    // split validators into validation functions and strings
                    if (typeof param.validator === 'string') {
                        validators = param.validator.split(':');
                    } else if (typeof param.validator === 'function') {
                        validators = [param.validator];
                    } else if (Array.isArray(param.validator)) {
                        validators = [];

                        for (const subValidator of param.validator) {
                            if (typeof subValidator === 'string') {
                                validators.push(...subValidator.split(':'));
                            } else if (typeof subValidator === 'function') {
                                validators.push(subValidator);
                            } else {
                                throw new Error(`Invalid validator type: ${typeof subValidator}`);
                            }
                        }
                    } else {
                        throw new Error(`Invalid validator type: ${typeof param.validator}`);
                    }

                    // convert built-in validators (strings) to functions
                    const validatorCount = validators.length;
                    if (validatorCount > 0) {
                        for (let v = 0; v < validatorCount; v++) {
                            const rawValidator = validators[v];
                            if (rawValidator === '') {
                                throw new Error('Leading or trailing ":" in validator list');
                            } else if (typeof rawValidator === 'string') {
                                const func = this.validators.get(rawValidator);
                                if (func === undefined) {
                                    throw new Error(`Built-in validator "${rawValidator}" does not exist`);
                                }

                                validators[v] = func;
                            }
                        }

                        // merge validators into a single validator
                        paramValidators.set(i, (inputValue: unknown) =>  {
                            let value = inputValue;
                            for (let v = 0, stop = false; !stop && v < validatorCount; v++) {
                                [value, stop] = (validators[v] as WidgetAutoXMLConfigValidator)(value);
                            }

                            return value;
                        });
                    }
                }

                paramNames.set(param.name, i);
            } else if (paramGeneric.mode === 'text') {
                const param = paramGeneric as WidgetXMLInputConfigTextParameter;

                if (hasTextNodeParam) {
                    throw new Error('Cannot add another "text" mode parameter; there can only be one text parameter. If you have more string parameters, add them as "value" mode parameters with a "string" validator, and only keep the most important string parameter as the "text" mode parameter');
                }

                if (param.name !== undefined) {
                    paramNames.set(param.name, i);
                }

                hasTextNodeParam = true;
            } else if (paramGeneric.mode === 'widget') {
                const param = paramGeneric as WidgetXMLInputConfigWidgetParameter;
                if (traps.has('widget')) {
                    throw new Error('Cannot add another "widget" mode parameter; there is already a previous widget parameter that is optional or a list');
                }

                if (param.list || param.optional) {
                    traps.add('widget');
                }

                if (param.name !== undefined) {
                    paramNames.set(param.name, i);
                }
            } else {
                const param = paramGeneric as WidgetXMLInputConfigParameter;
                const paramMode = param.mode;
                const paramConfig = this.parameterModes.get(paramMode);

                if (paramConfig === undefined) {
                    throw new Error(`Unknown parameter mode "${paramMode}"`);
                }

                const canBeList = paramConfig[1];
                const canBeOptional = paramConfig[2];

                if (traps.has(paramMode)) {
                    let msgEnd;
                    if (canBeList && canBeOptional) {
                        msgEnd = 'optional or a list';
                    } else if (canBeList) {
                        msgEnd = 'a list';
                    } else {
                        msgEnd = 'optional';
                    }

                    throw new Error(`Cannot add another "${paramMode}" parameter mode; there is already a previous parameter with the same mode that is ${msgEnd}`);
                }

                if ((canBeList && param.list) || (canBeOptional && param.optional)) {
                    traps.add(paramMode);
                }

                paramNames.set(param.name, i);
            }
        }

        // register factory
        this.factories.set(
            factoryName,
            (context, elem) => this.instantiateWidget(
                inputMapping, paramNames, paramValidators, factory,
                factoryName as string, context, elem
            ),
        );
    }

    /**
     * Similar to {@link BaseXMLUIParser#registerFactory}, except only a widget
     * class and an input mapping need to be supplied. The widget class will be
     * used to create a new factory; the factory will call the class constructor
     * with the `new` keyword.
     *
     * @param widgetClass - The class of the widget that will be instantiated. The class name will be used for the element name, and the class constructor will be used for making the factory function.
     * @param inputMapping - The input mapping for the widget factory
     */
    registerFactoryFromClass<T extends Widget>(widgetClass: new (...args: unknown[]) => T, inputMapping: WidgetXMLInputConfig): void {
        this.registerFactory(widgetClass, inputMapping, (...args) => new widgetClass(...args));
    }

    /**
     * Auto-register a factory for a given widget. Instead of passing an input
     * mapping, the input mapping is supplied in the {@link Widget.autoXML}
     * field of the widget class. If it's null, an error is thrown.
     *
     * @param widgetClass - The class to auto-register
     */
    autoRegisterFactory<T extends Widget = Widget>(widgetClass: (new (...args: unknown[]) => T) & { autoXML: WidgetAutoXML }) {
        if (widgetClass.autoXML === null) {
            throw new Error('Widget class does not have an automatic XML factory config object set. Must be manually registered');
        }

        if (Array.isArray(widgetClass.autoXML)) {
            this.registerFactoryFromClass(widgetClass, widgetClass.autoXML);
        } else {
            const config = widgetClass.autoXML;
            const nameOrClass = config.name ?? widgetClass;
            const factory = config.factory ?? ((...args) => new widgetClass(...args));
            this.registerFactory(nameOrClass, config.inputConfig, factory);
        }
    }
}