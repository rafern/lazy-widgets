import { readFileSync, writeFileSync } from 'fs';

function showError(error) {
    console.error(error);
    process.exit(1);
}

// Read config file
console.log('Reading config file (thyeme_properties.json)...');
let config;
try {
    const configData = readFileSync('theme_properties.json', 'utf8');
    config = JSON.parse(configData);
}
catch(error) {
    showError(`Failed to read config file (theme_properties.json): ${error}`);
}

// Validate config file
console.log('Validating config file...');
if(typeof config !== 'object')
    showError('Config file must be a JSON object, not an array or primitive value');
if(!('basetheme_path' in config) || typeof config.basetheme_path !== 'string')
    showError('Config file is missing a valid property "basetheme_path"; must contain path to source code file implementing the BaseTheme class');
if(!('basetheme_ctor_delimiter_start' in config) || typeof config.basetheme_ctor_delimiter_start !== 'string')
    showError('Config file is missing a valid property "basetheme_ctor_delimiter_start"; must contain the starting delimiter (usually a comment) for where to put constructor code for the BaseTheme class');
if(!('basetheme_ctor_delimiter_end' in config) || typeof config.basetheme_ctor_delimiter_end !== 'string')
    showError('Config file is missing a valid property "basetheme_ctor_delimiter_end"; must contain the ending delimiter (usually a comment) for where to put constructor code for the BaseTheme class');
if(!('basetheme_fields_delimiter_start' in config) || typeof config.basetheme_fields_delimiter_start !== 'string')
    showError('Config file is missing a valid property "basetheme_fields_delimiter_start"; must contain the starting delimiter (usually a comment) for where to put theme property fields code for the BaseTheme class');
if(!('basetheme_fields_delimiter_end' in config) || typeof config.basetheme_fields_delimiter_end !== 'string')
    showError('Config file is missing a valid property "basetheme_fields_delimiter_end"; must contain the ending delimiter (usually a comment) for where to put theme property fields code for the BaseTheme class');
if(!('themeproperties_path' in config) || typeof config.themeproperties_path !== 'string')
    showError('Config file is missing a valid property "themeproperties_path"; must contain path to source code file defining the ThemeProperties interface');
if(!('themeproperties_delimiter_start' in config) || typeof config.themeproperties_delimiter_start !== 'string')
    showError('Config file is missing a valid property "themeproperties_delimiter_start"; must contain the starting delimiter (usually a comment) for where to put theme property fields for the ThemeProperties interface');
if(!('themeproperties_delimiter_end' in config) || typeof config.themeproperties_delimiter_end !== 'string')
    showError('Config file is missing a valid property "themeproperties_delimiter_end"; must contain the ending delimiter (usually a comment) for where to put theme property fields for the ThemeProperties interface');
if(!('basetheme_ctor_themeproperties_arg_name' in config) || typeof config.basetheme_ctor_themeproperties_arg_name !== 'string')
    showError('Config file is missing a valid property "basetheme_ctor_themeproperties_arg_name"; must contain the argument name in the BaseTheme constructor of the optional theme properties');
if(!('basetheme_fallback_theme_name' in config) || typeof config.basetheme_fallback_theme_name !== 'string')
    showError('Config file is missing a valid property "basetheme_fallback_theme_name"; must contain the name of the fallback theme field in the BaseTheme class');
if(!('basetheme_theme_update_method_name' in config) || typeof config.basetheme_theme_update_method_name !== 'string')
    showError('Config file is missing a valid property "basetheme_theme_update_method_name"; must contain the name of the theme update method in the BaseTheme class');
if(!('properties' in config) || typeof config.properties !== 'object')
    showError('Config file is missing a valid property "properties; must contain an object mapping each theme property to its type, default value and description');

for(const [property, options] of Object.entries(config.properties)) {
    if(typeof property !== 'string')
        showError('Config file theme property value must be a string');
    if(typeof options !== 'object')
        showError('Config file theme property value must be an object');
    if(!('type' in options) || typeof options.type !== 'string')
        showError('Config file theme property value is missing a valid property "type"; must be a string containing the Typescript type of the theme property');
    if(!('default' in options) || typeof options.default !== 'string')
        showError('Config file theme property value is missing a valid property "default"; must be a string containing the default value of the theme property as it would be defined in code');
    if(!('description' in options) || typeof options.description !== 'string')
        showError('Config file theme property value is missing a valid property "description"; must be a string containing the description of the theme property, used for docstrings. Preferably, use typedoc tags in the string (such as {@link linkurl | this will be displayed instead of the link url})');
}





// Read BaseTheme file
console.log(`Reading BaseTheme file (${config.basetheme_path})...`);
let baseThemeFile;
try {
    const contents = readFileSync(config.basetheme_path, 'utf8');
    baseThemeFile = contents.split('\n');
}
catch(error) {
    showError(`Failed to read BaseTheme file (${config.basetheme_path}): ${error}`);
}

// Find delimiters in BaseTheme file
console.log(`Finding delimiters in BaseTheme file...`);
let baseThemeCtorStart = -1, baseThemeCtorEnd = -1, baseThemeFieldsStart = -1, baseThemeFieldsEnd = -1, ctorIndent = 0, fieldsIndent = 0, curLine = 0;
for(const line of baseThemeFile) {
    let tempIndent = line.indexOf(config.basetheme_ctor_delimiter_start);
    if(tempIndent !== -1) {
        if(baseThemeCtorStart === -1) {
            ctorIndent = tempIndent;
            baseThemeCtorStart = curLine;
        }
        else
            showError(`Multiple instances of basetheme_ctor_delimiter_start (${config.basetheme_ctor_delimiter_start}} found. Aborted`);
    }

    if(line.includes(config.basetheme_ctor_delimiter_end)) {
        if(baseThemeCtorEnd === -1)
            baseThemeCtorEnd = curLine;
        else
            showError(`Multiple instances of basetheme_ctor_delimiter_end (${config.basetheme_ctor_delimiter_end}} found. Aborted`);
    }

    tempIndent = line.indexOf(config.basetheme_fields_delimiter_start);
    if(tempIndent !== -1) {
        if(baseThemeFieldsStart === -1) {
            fieldsIndent = tempIndent;
            baseThemeFieldsStart = curLine;
        }
        else
            showError(`Multiple instances of basetheme_fields_delimiter_start (${config.basetheme_fields_delimiter_start}} found. Aborted`);
    }

    if(line.includes(config.basetheme_fields_delimiter_end)) {
        if(baseThemeFieldsEnd === -1)
            baseThemeFieldsEnd = curLine;
        else
            showError(`Multiple instances of basetheme_fields_delimiter_end (${config.basetheme_fields_delimiter_end}} found. Aborted`);
    }

    curLine++;
}

const baseThemeLines = [baseThemeCtorStart, baseThemeCtorEnd, baseThemeFieldsStart, baseThemeFieldsEnd];
if(baseThemeLines.includes(-1))
    showError('BaseTheme file has missing delimiters. Aborted');
else if((new Set(baseThemeLines)).size !== baseThemeLines.length)
    showError('BaseTheme file delimiters present in the same line. Aborted');
else if(baseThemeCtorStart > baseThemeCtorEnd)
    showError('The BaseTheme constructor start delimiter was after the end delimiter. Aborted');
else if(baseThemeFieldsStart > baseThemeFieldsEnd)
    showError('The BaseTheme fields start delimiter was after the end delimiter. Aborted');
else if(baseThemeCtorStart > baseThemeFieldsStart && baseThemeCtorStart < baseThemeFieldsEnd)
    showError('The BaseTheme fields start delimiter was between the fields delimiters. Aborted');
else if(baseThemeCtorEnd > baseThemeFieldsStart && baseThemeCtorEnd < baseThemeFieldsEnd)
    showError('The BaseTheme fields end delimiter was between the fields delimiters. Aborted');

// Generate code for BaseTheme
console.log('Generating code for BaseTheme...');

const ctorLines = [];
const fieldsLines = [];
const ctorIndentStr = ' '.repeat(ctorIndent);
const fieldsIndentStr = ' '.repeat(fieldsIndent);
for(const [property, options] of Object.entries(config.properties)) {
    // ctor
    ctorLines.push(`${ctorIndentStr}this._${property} = ${config.basetheme_ctor_themeproperties_arg_name}.${property};`);

    // fields
    const actualType = options.type === 'font' ? 'string' : options.type;
    fieldsLines.push(`${fieldsIndentStr}/** See {@link BaseTheme#${property}}. For internal use only. */`);
    fieldsLines.push(`${fieldsIndentStr}private _${property}?: ${actualType};`);
    fieldsLines.push('');
    fieldsLines.push(`${fieldsIndentStr}get ${property}(): ${actualType} {`);
    fieldsLines.push(`${fieldsIndentStr}    return this._${property} ?? this.${config.basetheme_fallback_theme_name}?.${property} ?? ${options.default};`);
    fieldsLines.push(`${fieldsIndentStr}}`);
    fieldsLines.push('');
    fieldsLines.push(`${fieldsIndentStr}set ${property}(value: ${actualType} | undefined) {`);
    fieldsLines.push(`${fieldsIndentStr}    if(this._${property} !== value) {`);
    fieldsLines.push(`${fieldsIndentStr}        this._${property} = value;`);
    fieldsLines.push(`${fieldsIndentStr}        this.${config.basetheme_theme_update_method_name}('${property}');`);
    fieldsLines.push(`${fieldsIndentStr}    }`);
    fieldsLines.push(`${fieldsIndentStr}}`);
    fieldsLines.push('');
}

// Inject BaseTheme code
console.log('Injecting BaseTheme code...');

// get first and last code "zones"
let firstStart = Math.min(baseThemeCtorStart, baseThemeFieldsStart);
let firstEnd = Math.min(baseThemeCtorEnd, baseThemeFieldsEnd);
let lastStart = Math.max(baseThemeCtorStart, baseThemeFieldsStart);
let lastEnd = Math.max(baseThemeCtorEnd, baseThemeFieldsEnd);
const firstCtor = firstStart === baseThemeCtorStart;

// inject "zones"
if(firstCtor) {
    baseThemeFile.splice(lastStart + 1, lastEnd - lastStart - 1, ...fieldsLines);
    baseThemeFile.splice(firstStart + 1, firstEnd - firstStart - 1, ...ctorLines);
}
else{
    baseThemeFile.splice(lastStart + 1, lastEnd - lastStart - 1, ...ctorLines);
    baseThemeFile.splice(firstStart + 1, firstEnd - firstStart - 1, ...fieldsLines);
}





// Read ThemeProperties file
console.log(`Reading ThemeProperties file (${config.themeproperties_path})...`);
let themePropertiesFile;
if(config.themeproperties_path === config.basetheme_path) {
    console.log('Same as the BaseTheme file. Skipped');
    themePropertiesFile = null;
}
else {
    try {
        const contents = readFileSync(config.themeproperties_path, 'utf8');
        themePropertiesFile = contents.split('\n');
    }
    catch(error) {
        showError(`Failed to read ThemeProperties file (${config.themeproperties_path}): ${error}`);
    }
}

// Find delimiters in ThemeProperties file
console.log(`Finding delimiters in ThemeProperties file...`);
let themePropertiesFieldsStart = -1, themePropertiesFieldsEnd = -1, themePropertiesIndent = 0;
curLine = 0;
for(const line of (themePropertiesFile ?? baseThemeFile)) {
    const tempIndent = line.indexOf(config.themeproperties_delimiter_start);
    if(tempIndent !== -1) {
        if(themePropertiesFieldsStart === -1) {
            themePropertiesIndent = tempIndent;
            themePropertiesFieldsStart = curLine;
        }
        else
            showError(`Multiple instances of themeproperties_delimiter_start (${config.themeproperties_delimiter_start}} found. Aborted`);
    }

    if(line.includes(config.themeproperties_delimiter_end)) {
        if(themePropertiesFieldsEnd === -1)
            themePropertiesFieldsEnd = curLine;
        else
            showError(`Multiple instances of themeproperties_delimiter_end (${config.themeproperties_delimiter_end}} found. Aborted`);
    }

    curLine++;
}

const themePropertiesLines = [themePropertiesFieldsStart, themePropertiesFieldsEnd];
if(themePropertiesLines.includes(-1))
    showError('ThemeProperties file has missing delimiters. Aborted. If ThemeProperties and BaseTheme are in the same file, check that the ThemeProperties delimiter is not between one of the BaseTheme delimiters');
else if((new Set(themePropertiesLines)).size !== themePropertiesLines.length)
    showError('ThemeProperties file delimiters present in the same line. Aborted');
else if(themePropertiesFieldsStart > themePropertiesFieldsEnd)
    showError('The ThemeProperties start delimiter was after the end delimiter. Aborted');

// Generate code for ThemeProperties
console.log('Generating code for ThemeProperties...');

const tpLines = [];
const themePropertiesIndentStr = ' '.repeat(themePropertiesIndent);
for(const [property, options] of Object.entries(config.properties)) {
    const actualType = options.type === 'font' ? 'string' : options.type;
    tpLines.push(`${themePropertiesIndentStr}/** ${options.description} */`);
    tpLines.push(`${themePropertiesIndentStr}${property}?: ${actualType};`);
}

// Inject ThemeProperties code
console.log('Injecting ThemeProperties code...');
(themePropertiesFile ?? baseThemeFile).splice(themePropertiesFieldsStart + 1, themePropertiesFieldsEnd - themePropertiesFieldsStart - 1, ...tpLines);





// Save files
console.log('Saving BaseTheme file...');
try {
    writeFileSync(config.basetheme_path, baseThemeFile.join('\n'));
}
catch(error) {
    showError(`Failed to write to BaseTheme file (${config.basetheme_path}): ${error}`);
}

console.log('Saving ThemeProperties file...');
if(themePropertiesFile === null)
    console.log('Same as the BaseTheme file. Skipped');
else {
    try {
        writeFileSync(config.themeproperties_path, themePropertiesFile.join('\n'));
    }
    catch(error) {
        showError(`Failed to write to ThemeProperties file (${config.themeproperties_path}): ${error}`);
    }
}
