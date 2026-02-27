import { Resvg } from '@resvg/resvg-js';
import * as fs from 'fs';

// Simulate a rank card render locally
const { renderRankCard } = await import('./src/utils/renderRankCard.ts');

const png = await renderRankCard({
    username: 'xeit0w',
    avatarUrl: null,
    rank: 1,
    level: 5,
    xpCurrent: 75,
    xpNext: 155,
    xpTotal: 850,
});

fs.writeFileSync('test-beach-rank.png', png);
console.log('Written test-beach-rank.png');
