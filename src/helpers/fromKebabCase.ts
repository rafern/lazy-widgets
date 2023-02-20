/**
 * Converts a lower kebab-case string to a camelCase string.
 *
 * @category Helper
 */
export function fromKebabCase(str: string): string {
    // handle empty strings
    const charCount = str.length;
    if (charCount === 0) {
        return str;
    }

    // convert to camelCase; push characters to accumulator, but if the
    // character is an hyphen, the next character will be capitalized
    let accum = '';
    let capitalize = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (char === '-') {
            if (capitalize) {
                accum += char;
            } else {
                capitalize = true;
            }
        } else if (capitalize) {
            capitalize = false;
            accum += char.toUpperCase();
        } else {
            accum += char.toLowerCase();
        }
    }

    if (capitalize) {
        accum += '-';
    }

    return accum;
}
