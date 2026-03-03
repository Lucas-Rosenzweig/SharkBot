/**
 * Génère une barre de progression en caractères Unicode.
 * @param current  Valeur actuelle
 * @param max      Valeur maximale
 * @param length   Nombre de segments (défaut 10)
 * @returns        Chaîne de type ▰▰▰▰▱▱▱▱▱▱
 */
export function progressBar(current: number, max: number, length = 10): string {
    const ratio = Math.min(current / max, 1);
    const filled = Math.round(ratio * length);
    const empty = length - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

/**
 * @deprecated Use `formatK` from `svgHelpers.ts` instead.
 */
export { formatK as formatNumber } from './svgHelpers';
