import { Resvg } from '@resvg/resvg-js';
import { escapeXml, fetchAvatarBase64, truncateUsername } from './svgHelpers';

export interface LevelUpCardData {
  username: string;
  avatarUrl: string | null;
  newLevel: number;
}

export async function renderLevelUpCard(data: LevelUpCardData): Promise<Buffer> {
  const { username, avatarUrl, newLevel } = data;

  const width = 800;
  const height = 300;

  // Avatar
  let avatarBase64 = '';
  if (avatarUrl) {
    avatarBase64 = await fetchAvatarBase64(avatarUrl);
  }

  const safeUsername = escapeXml(username);
  const displayUsername = truncateUsername(safeUsername);

  // Avatar section
  const avatarSvg = avatarBase64
    ? `<image href="${avatarBase64}" x="40" y="60" width="180" height="180" clip-path="url(#avatarClip)" />`
    : `<circle cx="130" cy="150" r="85" fill="#0C6E80" />
       <text x="130" y="180" text-anchor="middle" fill="#ffffff" font-size="72" font-weight="700" font-family="Inter, sans-serif" opacity="0.9">${safeUsername.charAt(0).toUpperCase()}</text>`;

  // Sand grain texture
  let sandGrains = '';
  const grainSeeds = [
    [60, 245, 1.5], [130, 260, 1.0], [200, 250, 1.3], [280, 265, 0.9], [350, 248, 1.4],
    [420, 270, 1.0], [500, 252, 1.2], [570, 268, 0.8], [640, 255, 1.5], [710, 262, 1.1],
    [90, 275, 0.9], [180, 258, 1.2], [260, 278, 0.8], [340, 260, 1.1], [450, 280, 1.3],
    [530, 255, 0.9], [610, 275, 1.0], [680, 250, 1.4], [750, 272, 0.8],
  ];
  for (const [x, y, r] of grainSeeds) {
    sandGrains += `<circle cx="${x}" cy="${y}" r="${r}" fill="#B8883A" opacity="${0.15 + Math.random() * 0.2}" />`;
  }

  // Water sparkles
  let waterSparkles = '';
  const sparkleSeed = [
    [300, 160, 1.2], [400, 170, 0.9], [500, 155, 1.5], [600, 175, 1.0], [700, 165, 1.3],
    [350, 180, 0.8], [450, 168, 1.1], [550, 185, 0.7], [650, 158, 1.2],
  ];
  for (const [x, y, r] of sparkleSeed) {
    waterSparkles += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${0.2 + Math.random() * 0.25}" />`;
  }

  // Confetti / celebration particles
  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  let confetti = '';
  const confettiSeeds = [
    [280, 30, 0], [350, 55, 25], [420, 20, -15], [490, 45, 10], [560, 25, -20],
    [630, 50, 30], [700, 35, -10], [310, 65, 15], [380, 40, -25], [450, 60, 20],
    [520, 15, -5], [590, 70, 35], [660, 28, -30], [730, 58, 12], [340, 75, -18],
    [410, 10, 22], [480, 68, -12], [550, 42, 28], [620, 18, -22], [690, 72, 8],
  ];
  for (let i = 0; i < confettiSeeds.length; i++) {
    const [x, y, rot] = confettiSeeds[i];
    const color = confettiColors[i % confettiColors.length];
    const opacity = 0.5 + Math.random() * 0.4;
    if (i % 3 === 0) {
      confetti += `<circle cx="${x}" cy="${y}" r="${2 + Math.random() * 2}" fill="${color}" opacity="${opacity}" />`;
    } else if (i % 3 === 1) {
      confetti += `<rect x="${x}" y="${y}" width="${4 + Math.random() * 3}" height="${8 + Math.random() * 4}" rx="1" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${x} ${y})" />`;
    } else {
      confetti += `<polygon points="${x},${y - 4} ${x + 3.5},${y + 2} ${x - 3.5},${y + 2}" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${x} ${y})" />`;
    }
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

    <!-- Sand gradient -->
    <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F0CC78" />
      <stop offset="40%" stop-color="#E4B860" />
      <stop offset="100%" stop-color="#C9953E" />
    </linearGradient>

    <!-- Wet sand -->
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

    <!-- Avatar ring -->
    <linearGradient id="avatarRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD700" />
      <stop offset="50%" stop-color="#FFA500" />
      <stop offset="100%" stop-color="#FFD700" />
    </linearGradient>

    <!-- Level badge gradient -->
    <linearGradient id="levelBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>

    <!-- Text shadow -->
    <filter id="ts" x="-10%" y="-10%" width="120%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.7" />
    </filter>
    <filter id="tsLight" x="-10%" y="-10%" width="120%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.5" />
    </filter>

    <!-- Glow effect for level number -->
    <filter id="levelGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <clipPath id="cardClip"><rect width="${width}" height="${height}" rx="24" /></clipPath>
    <clipPath id="avatarClip"><circle cx="130" cy="150" r="85" /></clipPath>
  </defs>

  <g clip-path="url(#cardClip)">

    <!-- ===== SKY ===== -->
    <rect width="${width}" height="${height}" fill="url(#skyGrad)" />

    <!-- Clouds -->
    <ellipse cx="120" cy="35" rx="55" ry="16" fill="white" opacity="0.3" />
    <ellipse cx="150" cy="28" rx="38" ry="14" fill="white" opacity="0.25" />
    <ellipse cx="95" cy="30" rx="35" ry="12" fill="white" opacity="0.2" />

    <ellipse cx="580" cy="45" rx="60" ry="15" fill="white" opacity="0.22" />
    <ellipse cx="620" cy="38" rx="40" ry="13" fill="white" opacity="0.18" />

    <!-- Sun -->
    <circle cx="720" cy="50" r="60" fill="url(#sunGlow)" />
    <circle cx="720" cy="50" r="28" fill="url(#sunGrad)" />

    <!-- Sun rays -->
    <line x1="720" y1="12" x2="720" y2="4" stroke="#FFD54F" stroke-width="2" opacity="0.3" />
    <line x1="748" y1="24" x2="755" y2="18" stroke="#FFD54F" stroke-width="2" opacity="0.25" />
    <line x1="758" y1="50" x2="766" y2="50" stroke="#FFD54F" stroke-width="2" opacity="0.3" />
    <line x1="748" y1="76" x2="755" y2="82" stroke="#FFD54F" stroke-width="2" opacity="0.25" />

    <!-- Birds -->
    <path d="M600,30 Q605,24 610,30 Q615,24 620,30" fill="none" stroke="#2A4A5A" stroke-width="1.5" opacity="0.35" />
    <path d="M650,42 Q654,37 658,42 Q662,37 666,42" fill="none" stroke="#2A4A5A" stroke-width="1.2" opacity="0.25" />

    <!-- ===== OCEAN ===== -->
    <rect x="0" y="150" width="${width}" height="50" fill="#0D7E95" opacity="0.45" />

    <!-- Waves -->
    <path d="M0,165 Q50,150 100,165 T200,165 T300,165 T400,165 T500,165 T600,165 T700,165 T${width},165 L${width},${height} L0,${height} Z" fill="#0B7A8E" opacity="0.35" />
    <path d="M0,185 Q65,170 130,185 T260,185 T390,185 T520,185 T650,185 T${width},185 L${width},${height} L0,${height} Z" fill="#0891B2" opacity="0.3" />
    <path d="M0,200 Q45,192 90,200 T180,200 T270,200 T360,200 T450,200 T540,200 T630,200 T720,200 T${width},200 L${width},${height} L0,${height} Z" fill="#0E94A8" opacity="0.25" />

    <!-- Foam lines -->
    <path d="M0,210 Q35,205 70,210 T140,210 T210,210 T280,210 T350,210 T420,210 T490,210 T560,210 T630,210 T700,210 T770,210 T${width},210" fill="none" stroke="white" stroke-width="2" opacity="0.45" />
    <path d="M20,216 Q50,213 80,216 T140,216 T200,216 T260,216 T320,216 T380,216 T440,216 T500,216 T560,216 T620,216 T680,216 T740,216 T${width},216" fill="none" stroke="white" stroke-width="1.2" opacity="0.3" />

    <!-- Water sparkles -->
    ${waterSparkles}

    <!-- ===== SAND ===== -->
    <!-- Wet sand strip -->
    <path d="M0,218 Q40,214 80,218 T160,218 T240,218 T320,218 T400,218 T480,218 T560,218 T640,218 T720,218 T${width},218 L${width},240 L0,240 Z" fill="url(#wetSandGrad)" opacity="0.7" />

    <!-- Dry sand -->
    <path d="M0,235 Q50,230 100,235 T200,235 T300,235 T400,235 T500,235 T600,235 T700,235 T${width},235 L${width},${height} L0,${height} Z" fill="url(#sandGrad)" />

    <!-- Sand grains -->
    ${sandGrains}

    <!-- Starfish -->
    <g transform="translate(720,265) scale(0.5)" opacity="0.35">
      <path d="M0,-14 L3.5,-4.5 L14,-4.5 L6,2.5 L8.5,12 L0,6 L-8.5,12 L-6,2.5 L-14,-4.5 L-3.5,-4.5 Z" fill="#E07040" />
      <circle cx="0" cy="0" r="2.5" fill="#C05030" opacity="0.5" />
    </g>

    <!-- Seashell -->
    <g opacity="0.35">
      <ellipse cx="620" cy="270" rx="6" ry="4" fill="#E8D0A0" />
      <path d="M614,270 Q620,263 626,270" fill="none" stroke="#C4A060" stroke-width="0.8" />
    </g>

    <!-- Palm tree silhouette -->
    <g transform="translate(760, 120) scale(0.5)" opacity="0.12">
      <path d="M0,0 L-3,100 L3,100 Z" fill="#1A3A3A" />
      <path d="M0,0 Q-45,-10 -55,16 Q-28,0 0,0 Z" fill="#1A3A3A" />
      <path d="M0,0 Q45,-15 58,10 Q28,-4 0,0 Z" fill="#1A3A3A" />
      <path d="M0,0 Q-5,-42 12,-55 Q6,-22 0,0 Z" fill="#1A3A3A" />
    </g>

    <!-- ===== CELEBRATION CONFETTI ===== -->
    ${confetti}

    <!-- ===== AVATAR ===== -->
    <!-- Shadow -->
    <circle cx="130" cy="153" r="94" fill="rgba(0,0,0,0.12)" />

    <!-- Outer ring (golden for celebration) -->
    <circle cx="130" cy="150" r="94" fill="url(#avatarRingGrad)" />
    <circle cx="130" cy="150" r="88" fill="#0A5E6E" />

    <!-- Avatar image -->
    ${avatarSvg}

    <!-- ===== TEXT CONTENT ===== -->

    <!-- Dark backdrop -->
    <rect x="250" y="55" width="510" height="190" rx="18" fill="rgba(0,0,0,0.3)" />

    <!-- LEVEL UP! title -->
    <text x="505" y="105" text-anchor="middle" fill="#FFD700" font-size="38" font-weight="700" filter="url(#ts)">⬆ LEVEL UP!</text>

    <!-- Username -->
    <text x="505" y="148" text-anchor="middle" fill="#FFFFFF" font-size="30" font-weight="700" filter="url(#tsLight)">${displayUsername}</text>

    <!-- Level badge -->
    <rect x="${505 - (90 + String(newLevel).length * 14) / 2}" y="162" width="${90 + String(newLevel).length * 14}" height="50" rx="10" fill="url(#levelBadgeGrad)" />
    <text x="505" y="195" text-anchor="middle" fill="#4A2800" font-size="28" font-weight="700">LVL ${newLevel}</text>

    <!-- Sparkle decorations around level -->
    <text x="280" y="115" fill="#FFD700" font-size="20" opacity="0.7" filter="url(#tsLight)">✨</text>
    <text x="720" y="115" fill="#FFD700" font-size="20" opacity="0.7" filter="url(#tsLight)">✨</text>
    <text x="300" y="200" fill="#FFD700" font-size="16" opacity="0.5" filter="url(#tsLight)">⭐</text>
    <text x="700" y="200" fill="#FFD700" font-size="16" opacity="0.5" filter="url(#tsLight)">⭐</text>

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


