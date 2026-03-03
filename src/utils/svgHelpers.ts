/**
 * Escapes XML special characters for safe SVG embedding.
 */
export function escapeXml(str: string): string {
    return str.replace(/[<>&"']/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return c;
        }
    });
}

/**
 * Formats a number with K/M suffixes.
 */
export function formatK(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Fetches an image URL and returns a base64 data URI string.
 * Returns empty string on failure.
 */
export async function fetchAvatarBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
    } catch {
        return '';
    }
}

/**
 * Truncates a username for display, adding ellipsis if needed.
 */
export function truncateUsername(name: string, maxLength = 16): string {
    return name.length > maxLength ? name.substring(0, maxLength - 2) + '…' : name;
}

