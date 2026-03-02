/**
 * Génère une barre de progression en caractères Unicode.
 * @param current  Valeur actuelle
 * @param max      Valeur maximale
 * @param length   Nombre de segments (défaut 10)
 * @returns        Chaîne de type ▰▰▰▰▱▱▱▱▱▱
 */
export function progressBar(current, max, length = 10) {
    const ratio = Math.min(current / max, 1);
    const filled = Math.round(ratio * length);
    const empty = length - filled;
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}
/**
 * Formate un grand nombre avec des suffixes (K, M, …).
 */
export function formatNumber(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}
