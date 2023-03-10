/**
 * Converts a string to lower kebab-case.
 *
 * @category Helper
 */
export function toKebabCase(str: string): string {
    // handle empty strings
    const charCount = str.length;
    if (charCount === 0) {
        return str;
    }

    // convert upper case characters to breaks with hyphens
    let accum = str[0].toLowerCase();
    for (let i = 1; i < str.length; i++) {
        const char = str[i];

        if (char === ':') {
            throw new Error('Colon characters are not allowed in element or variable names');
        }

        const charLower = char.toLowerCase();
        if (char === charLower) {
            accum += charLower;
        } else {
            // letter is upper case, create break
            accum = `${accum}-${charLower}`;
        }
    }

    return accum;
}
