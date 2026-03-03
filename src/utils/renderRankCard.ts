import { Resvg } from '@resvg/resvg-js';
import { escapeXml, formatK, fetchAvatarBase64, truncateUsername } from './svgHelpers';

export interface RankCardData {
  username: string;
  avatarUrl: string | null;
  rank: number;
  level: number;
  xpCurrent: number;
  xpNext: number;
  xpTotal: number;
}

export async function renderRankCard(data: RankCardData): Promise<Buffer> {
  const { username, avatarUrl, rank, level, xpCurrent, xpNext } = data;

  const width = 1200;
  const height = 400;

  // Progression
  const progressText = xpNext > 0 ? `${formatK(xpCurrent)} / ${formatK(xpNext)} XP` : 'Max Level';
  const progress = xpNext > 0 ? Math.min(Math.max(xpCurrent / xpNext, 0), 1) : 1;

  const barWidth = 660;
  const barFilled = Math.max(Math.round(progress * barWidth), 16);

  // Avatar
  let avatarBase64 = '';
  if (avatarUrl) {
    avatarBase64 = await fetchAvatarBase64(avatarUrl);
  }

  const safeUsername = escapeXml(username);
  const displayUsername = truncateUsername(safeUsername);

  // Avatar section
  const avatarSvg = avatarBase64
    ? `<image href="${avatarBase64}" x="45" y="55" width="240" height="240" clip-path="url(#avatarClip)" />`
    : `<circle cx="165" cy="175" r="114" fill="#0C6E80" />
       <text x="165" y="205" text-anchor="middle" fill="#ffffff" font-size="90" font-weight="700" font-family="Inter, sans-serif" opacity="0.9">${safeUsername.charAt(0).toUpperCase()}</text>`;

  // XP bar fill
  const progressBarSvg = barFilled > 0
    ? `<rect x="410" y="298" width="${barFilled}" height="36" rx="18" fill="url(#waveBarGrad)" />`
    : '';

  // Sand grain texture — randomized dots
  let sandGrains = '';
  const grainSeeds = [
    [80, 330, 1.8], [150, 355, 1.2], [230, 340, 1.5], [310, 365, 1.0], [400, 345, 1.6], [470, 370, 1.1],
    [550, 335, 1.4], [620, 360, 1.0], [700, 350, 1.7], [780, 375, 1.2], [850, 338, 1.5], [920, 362, 1.1],
    [1000, 345, 1.3], [1070, 370, 1.6], [1140, 340, 1.0], [100, 370, 1.3], [250, 380, 0.9], [380, 350, 1.4],
    [500, 378, 1.0], [630, 342, 1.5], [760, 368, 0.8], [890, 355, 1.2], [1020, 380, 1.4], [1100, 360, 0.9],
    [60, 360, 1.0], [190, 345, 1.3], [340, 375, 0.8], [450, 355, 1.1], [580, 380, 1.5], [710, 340, 0.9],
    [830, 365, 1.2], [960, 350, 1.4], [1060, 340, 1.0], [130, 385, 0.8], [270, 350, 1.1], [420, 380, 0.7],
  ];
  for (const [x, y, r] of grainSeeds) {
    sandGrains += `<circle cx="${x}" cy="${y}" r="${r}" fill="#B8883A" opacity="${0.15 + Math.random() * 0.2}" />`;
  }

  // Water sparkle dots
  let waterSparkles = '';
  const sparkleSeed = [
    [350, 220, 1.5], [480, 235, 1.0], [620, 215, 1.8], [750, 240, 1.2], [880, 225, 1.5],
    [420, 250, 1.0], [560, 230, 1.3], [690, 255, 0.8], [820, 218, 1.4], [1000, 238, 1.1],
    [300, 260, 0.9], [530, 245, 1.2], [670, 260, 0.7], [810, 250, 1.0], [950, 255, 1.3],
  ];
  for (const [x, y, r] of sparkleSeed) {
    waterSparkles += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${0.2 + Math.random() * 0.25}" />`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>text { font-family: 'Inter', 'DejaVu Sans', sans-serif; }</style>

    <!-- Sky gradient -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#5ABBE6" />
      <stop offset="30%" stop-color="#3AA0D1" />
      <stop offset="55%" stop-color="#1A8EBC" />
      <stop offset="100%" stop-color="#0E7B8F" />
    </linearGradient>

    <!-- Sand gradient with more depth -->
    <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F0CC78" />
      <stop offset="40%" stop-color="#E4B860" />
      <stop offset="100%" stop-color="#C9953E" />
    </linearGradient>

    <!-- Wet sand near water -->
    <linearGradient id="wetSandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#B8A05A" />
      <stop offset="100%" stop-color="#D4B46A" />
    </linearGradient>

    <!-- Sun gradient -->
    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFF9C4" />
      <stop offset="40%" stop-color="#FFE082" />
      <stop offset="100%" stop-color="#FFB300" />
    </radialGradient>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFE082" stop-opacity="0.5" />
      <stop offset="60%" stop-color="#FFECB3" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#FFECB3" stop-opacity="0" />
    </radialGradient>

    <!-- XP bar gradient -->
    <linearGradient id="waveBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0891B2" />
      <stop offset="50%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#67E8F9" />
    </linearGradient>

    <!-- Avatar ring -->
    <linearGradient id="avatarRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#FFB300" />
    </linearGradient>

    <!-- Badge gradients -->
    <linearGradient id="rankBadgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>
    <linearGradient id="levelBadgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0E7490" />
      <stop offset="100%" stop-color="#0891B2" />
    </linearGradient>

    <!-- Text shadow for strong contrast -->
    <filter id="ts" x="-10%" y="-10%" width="120%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.7" />
    </filter>
    <filter id="tsLight" x="-10%" y="-10%" width="120%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.5" />
    </filter>

    <!-- Bar glow -->
    <filter id="barGlow" x="-5%" y="-30%" width="110%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <clipPath id="cardClip"><rect width="${width}" height="${height}" rx="24" /></clipPath>
    <clipPath id="avatarClip"><circle cx="165" cy="175" r="114" /></clipPath>
  </defs>

  <g clip-path="url(#cardClip)">

    <!-- ===== SKY ===== -->
    <rect width="${width}" height="${height}" fill="url(#skyGrad)" />

    <!-- Clouds with more depth -->
    <ellipse cx="200" cy="50" rx="80" ry="22" fill="white" opacity="0.3" />
    <ellipse cx="240" cy="40" rx="55" ry="20" fill="white" opacity="0.25" />
    <ellipse cx="170" cy="45" rx="50" ry="17" fill="white" opacity="0.2" />

    <ellipse cx="700" cy="65" rx="90" ry="20" fill="white" opacity="0.22" />
    <ellipse cx="750" cy="55" rx="60" ry="18" fill="white" opacity="0.18" />
    <ellipse cx="670" cy="58" rx="45" ry="15" fill="white" opacity="0.15" />

    <ellipse cx="500" cy="32" rx="45" ry="14" fill="white" opacity="0.18" />
    <ellipse cx="1050" cy="42" rx="55" ry="16" fill="white" opacity="0.15" />

    <!-- Sun -->
    <circle cx="1080" cy="65" r="80" fill="url(#sunGlow)" />
    <circle cx="1080" cy="65" r="38" fill="url(#sunGrad)" />

    <!-- Sun rays -->
    <line x1="1080" y1="15" x2="1080" y2="5" stroke="#FFD54F" stroke-width="2" opacity="0.3" />
    <line x1="1115" y1="30" x2="1125" y2="22" stroke="#FFD54F" stroke-width="2" opacity="0.25" />
    <line x1="1130" y1="65" x2="1142" y2="65" stroke="#FFD54F" stroke-width="2" opacity="0.3" />
    <line x1="1115" y1="100" x2="1125" y2="108" stroke="#FFD54F" stroke-width="2" opacity="0.25" />
    <line x1="1045" y1="30" x2="1035" y2="22" stroke="#FFD54F" stroke-width="2" opacity="0.25" />

    <!-- Birds -->
    <path d="M880,40 Q886,32 892,40 Q898,32 904,40" fill="none" stroke="#2A4A5A" stroke-width="2" opacity="0.35" />
    <path d="M940,58 Q944,53 948,58 Q952,53 956,58" fill="none" stroke="#2A4A5A" stroke-width="1.5" opacity="0.28" />
    <path d="M860,62 Q865,56 870,62 Q875,56 880,62" fill="none" stroke="#2A4A5A" stroke-width="1.5" opacity="0.22" />

    <!-- ===== OCEAN ===== -->
    <rect x="0" y="200" width="${width}" height="70" fill="#0D7E95" opacity="0.45" />

    <!-- Deep wave -->
    <path d="M0,220 Q70,200 140,220 T280,220 T420,220 T560,220 T700,220 T840,220 T980,220 T1120,220 T${width},220 L${width},${height} L0,${height} Z" fill="#0B7A8E" opacity="0.35" />

    <!-- Mid wave -->
    <path d="M0,245 Q90,225 180,245 T360,245 T540,245 T720,245 T900,245 T1080,245 T${width},245 L${width},${height} L0,${height} Z" fill="#0891B2" opacity="0.3" />

    <!-- Shallow wave -->
    <path d="M0,265 Q60,255 120,265 T240,265 T360,265 T480,265 T600,265 T720,265 T840,265 T960,265 T1080,265 T${width},265 L${width},${height} L0,${height} Z" fill="#0E94A8" opacity="0.25" />

    <!-- Foam lines -->
    <path d="M0,275 Q40,269 80,275 T160,275 T240,275 T320,275 T400,275 T480,275 T560,275 T640,275 T720,275 T800,275 T880,275 T960,275 T1040,275 T1120,275 T${width},275" fill="none" stroke="white" stroke-width="2.5" opacity="0.45" />
    <path d="M30,282 Q60,278 90,282 T150,282 T210,282 T270,282 T330,282 T390,282 T450,282 T510,282 T570,282 T630,282 T690,282 T750,282 T810,282 T870,282 T930,282 T990,282 T1050,282 T1110,282 T${width},282" fill="none" stroke="white" stroke-width="1.5" opacity="0.3" />

    <!-- Water sparkles -->
    ${waterSparkles}

    <!-- ===== SAND ===== -->
    <!-- Wet sand strip -->
    <path d="M0,285 Q50,280 100,285 T200,285 T300,285 T400,285 T500,285 T600,285 T700,285 T800,285 T900,285 T1000,285 T1100,285 T${width},285 L${width},310 L0,310 Z" fill="url(#wetSandGrad)" opacity="0.7" />

    <!-- Dry sand -->
    <path d="M0,305 Q70,298 140,305 T280,305 T420,305 T560,305 T700,305 T840,305 T980,305 T1120,305 T${width},305 L${width},${height} L0,${height} Z" fill="url(#sandGrad)" />

    <!-- Sand grain texture -->
    ${sandGrains}

    <!-- Seashells -->
    <g opacity="0.4">
      <ellipse cx="920" cy="355" rx="8" ry="5" fill="#E8D0A0" />
      <path d="M912,355 Q920,345 928,355" fill="none" stroke="#C4A060" stroke-width="1" />
      <line x1="920" y1="347" x2="920" y2="355" stroke="#C4A060" stroke-width="0.5" opacity="0.5" />
    </g>
    <g opacity="0.3">
      <ellipse cx="150" cy="375" rx="6" ry="4" fill="#E0C890" />
      <path d="M144,375 Q150,368 156,375" fill="none" stroke="#B89860" stroke-width="0.8" />
    </g>

    <!-- Starfish -->
    <g transform="translate(1100,365) scale(0.55)" opacity="0.35">
      <path d="M0,-14 L3.5,-4.5 L14,-4.5 L6,2.5 L8.5,12 L0,6 L-8.5,12 L-6,2.5 L-14,-4.5 L-3.5,-4.5 Z" fill="#E07040" />
      <circle cx="0" cy="0" r="2.5" fill="#C05030" opacity="0.5" />
    </g>

    <!-- Palm tree silhouette -->
    <g transform="translate(1140, 155) scale(0.7)" opacity="0.15">
      <path d="M0,0 L-4,120 L4,120 Z" fill="#1A3A3A" />
      <path d="M0,0 Q-55,-12 -65,20 Q-35,2 0,0 Z" fill="#1A3A3A" />
      <path d="M0,0 Q55,-18 70,12 Q35,-6 0,0 Z" fill="#1A3A3A" />
      <path d="M0,0 Q-40,-40 -28,-58 Q-14,-25 0,0 Z" fill="#1A3A3A" />
      <path d="M0,0 Q35,-45 48,-52 Q20,-22 0,0 Z" fill="#1A3A3A" />
      <path d="M0,0 Q-6,-52 14,-65 Q7,-28 0,0 Z" fill="#1A3A3A" />
    </g>

    <!-- Second smaller palm -->
    <g transform="translate(1165, 185) scale(0.4)" opacity="0.1">
      <path d="M0,0 L-3,90 L3,90 Z" fill="#1A3A3A" />
      <path d="M0,0 Q-45,-10 -55,16 Q-28,0 0,0 Z" fill="#1A3A3A" />
      <path d="M0,0 Q45,-15 58,10 Q28,-4 0,0 Z" fill="#1A3A3A" />
      <path d="M0,0 Q-5,-42 12,-55 Q6,-22 0,0 Z" fill="#1A3A3A" />
    </g>

    <!-- ===== AVATAR ===== -->
    <!-- Shadow -->
    <circle cx="165" cy="178" r="124" fill="rgba(0,0,0,0.12)" />

    <!-- Outer ring -->
    <circle cx="165" cy="175" r="124" fill="url(#avatarRingGrad)" />
    <circle cx="165" cy="175" r="117" fill="#0A5E6E" />

    <!-- Avatar image -->
    ${avatarSvg}

    <!-- Progress arc around avatar -->
    <circle cx="165" cy="175" r="124" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="6" />
    <circle cx="165" cy="175" r="124" fill="none" stroke="url(#avatarRingGrad)" stroke-width="6"
            stroke-dasharray="${2 * Math.PI * 124}" stroke-dashoffset="${2 * Math.PI * 124 * (1 - progress)}"
            transform="rotate(-90 165 175)" stroke-linecap="round" />

    <!-- ===== TEXT (high contrast) ===== -->

    <!-- Dark semi-transparent backdrop behind username area (full width) -->
    <rect x="305" y="30" width="795" height="140" rx="18" fill="rgba(0,0,0,0.28)" />

    <!-- Username (left side) -->
    <text x="340" y="95" fill="#FFFFFF" font-size="56" font-weight="700" filter="url(#ts)">${displayUsername}</text>

    <!-- Rank badge (right-aligned inside card) -->
    <rect x="${1070 - (95 + String(level).length * 16) - 14 - (68 + String(rank).length * 20)}" y="55" width="${68 + String(rank).length * 20}" height="40" rx="20" fill="url(#rankBadgeGrad)" />
    <text x="${1070 - (95 + String(level).length * 16) - 14 - (68 + String(rank).length * 20) / 2}" y="83" text-anchor="middle" fill="#4A2800" font-size="24" font-weight="700">#${rank}</text>

    <!-- Level badge (right of rank badge) -->
    <rect x="${1070 - (95 + String(level).length * 16)}" y="55" width="${95 + String(level).length * 16}" height="40" rx="20" fill="url(#levelBadgeGrad)" />
    <text x="${1070 - (95 + String(level).length * 16) / 2}" y="83" text-anchor="middle" fill="#FFFFFF" font-size="24" font-weight="700">LVL ${level}</text>

    <!-- XP progress text under badges (right-aligned) -->
    <text x="1070" y="135" text-anchor="end" fill="rgba(255,255,255,0.7)" font-size="20" font-weight="700" filter="url(#tsLight)">${progressText}</text>

    <!-- Dark backdrop behind XP section (padded) -->
    <rect x="380" y="245" width="720" height="142" rx="18" fill="rgba(0,0,0,0.28)" />

    <!-- XP text (inside card with top padding) -->
    <text x="1070" y="282" text-anchor="end" fill="#FFFFFF" font-size="38" font-weight="700" filter="url(#ts)">${progressText}</text>

    <!-- XP bar bg (centered in card) -->
    <rect x="410" y="296" width="${barWidth}" height="44" rx="22" fill="rgba(0,0,0,0.35)" />

    <!-- XP bar fill -->
    ${progressBarSvg.replace('y="298"', 'y="296"').replace('height="36"', 'height="44"').replace('rx="18"', 'rx="22"')}

    <!-- Bar shine -->
    ${barFilled > 30 ? `<rect x="410" y="296" width="${barFilled}" height="22" rx="22" fill="rgba(255,255,255,0.18)" />` : ''}

    <!-- Percentage on bar -->
    <text x="${410 + barWidth / 2}" y="326" text-anchor="middle" fill="#FFFFFF" font-size="26" font-weight="700" filter="url(#ts)">${Math.round(progress * 100)}%</text>

    <!-- Total XP (bottom padding inside card) -->
    <text x="1070" y="372" text-anchor="end" fill="#FFFFFF" font-size="24" font-weight="700" filter="url(#ts)">Total: ${formatK(data.xpTotal)} XP</text>

  </g>

  <!-- Card border -->
  <rect width="${width}" height="${height}" rx="24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2.5" />
</svg>`;

  const resvg = new Resvg(svg, {
    background: 'rgba(0,0,0,0)',
    fitTo: { mode: 'width', value: width },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Inter',
    },
  });

  return resvg.render().asPng();
}

