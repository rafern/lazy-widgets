/**
 * Converts a string to kebab-case.
 *
 * @internal
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
        const charLower = char.toLowerCase();
        if (char === charLower) {
            accum += char;
        } else {
            // letter is upper case, create break
            accum = `${accum}-${char}`;
        }
    }

    return accum;
}
