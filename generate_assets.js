import fs from 'fs/promises';
import path from 'path';

const USERNAME = 'bobberdolle1';
const API_URL = `https://api.github.com/users/${USERNAME}/repos?sort=stargazers&per_page=100`;

const REST_HEADERS = {
    'User-Agent': 'bobberdolle1-readme-generator',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {})
};

// PS2 boot-screen grade: cold blue-white light in a black void.
// No magenta — synthwave pink was fighting the console look.
const COLORS = {
    bg: '#01030a',
    void: '#000206',
    ice: '#cfeeff',   // hottest tower light
    cyan: '#7fd4ff',
    blue: '#1d6fb8',
    deep: '#0a2c55',
    white: '#ffffff',
    gray: '#4a5a70',
    darkGray: '#0a1018'
};

/* ------------------------------------------------------------------ *
 * data
 * ------------------------------------------------------------------ */

// Returns every public non-fork repo plus the top slice for the cards.
// Stats must be computed over ALL repos — an earlier version sliced to 6
// first and then reported "PUBLIC REPOS: 6" for a 21-repo profile.
async function fetchRepos() {
    const res = await fetch(API_URL, { headers: REST_HEADERS });
    if (!res.ok) throw new Error(`repo list: ${res.status} ${res.statusText}`);
    const data = await res.json();
    const own = data.filter(repo => !repo.fork && repo.name !== USERNAME);
    return {
        all: own,
        top: [...own].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6)
    };
}

async function fetchUser() {
    const res = await fetch(`https://api.github.com/users/${USERNAME}`, { headers: REST_HEADERS });
    if (!res.ok) throw new Error(`user: ${res.status} ${res.statusText}`);
    return res.json();
}

// Aggregate language bytes across public sources only (privacy: PUBLIC), so
// local runs with a broad token and Actions runs with the repo-scoped
// GITHUB_TOKEN produce identical art.
async function fetchLanguages() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is required for the languages GraphQL API');
    const query = `query($login:String!){
        user(login:$login){
            repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC){
                nodes{ languages(first:10, orderBy:{field:SIZE, direction:DESC}){
                    edges{ size node{ name } }
                } }
            }
        }
    }`;
    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': REST_HEADERS['User-Agent'] },
        body: JSON.stringify({ query, variables: { login: USERNAME } })
    });
    const json = await res.json();
    const nodes = json?.data?.user?.repositories?.nodes;
    if (!nodes) throw new Error(`GraphQL returned no repositories: ${JSON.stringify(json).slice(0, 300)}`);
    const totals = new Map();
    for (const n of nodes)
        for (const e of n.languages.edges)
            totals.set(e.node.name, (totals.get(e.node.name) || 0) + e.size);
    const sum = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
    return [...totals.entries()]
        .map(([name, size]) => ({ name, share: size / sum }))
        .sort((a, b) => b.share - a.share);
}

// Exact per-day counts via GraphQL. The old version scraped the contributions
// HTML page for data-level (0-4), which quantised an 80-commit day and a
// 5-commit day into the same tower. Real counts give a real skyline.
async function fetchContributions() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is required for the contributions GraphQL API');

    const query = `query($login:String!){
        user(login:$login){
            contributionsCollection{
                contributionCalendar{
                    totalContributions
                    weeks{ contributionDays{ date contributionCount weekday } }
                }
            }
        }
    }`;

    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'bobberdolle1-readme-generator'
        },
        body: JSON.stringify({ query, variables: { login: USERNAME } })
    });

    const json = await res.json();
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) throw new Error(`GraphQL returned no calendar: ${JSON.stringify(json).slice(0, 300)}`);
    return cal;
}

function escapeHtml(unsafe) {
    return (unsafe || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function lerpHex(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))));
    return '#' + mix.map(v => v.toString(16).padStart(2, '0')).join('');
}

const r2 = n => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ *
 * shared defs
 * ------------------------------------------------------------------ */

function createDefs() {
    return `
    <defs>
        <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${COLORS.void}" />
            <stop offset="55%" stop-color="${COLORS.bg}" />
            <stop offset="100%" stop-color="#020713" />
        </linearGradient>
        <radialGradient id="horizonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#0a4a86" stop-opacity="0.55" />
            <stop offset="60%" stop-color="#062a52" stop-opacity="0.18" />
            <stop offset="100%" stop-color="${COLORS.bg}" stop-opacity="0" />
        </radialGradient>
        <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <style>
            .t-title { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-weight: 300; letter-spacing: 6px; fill: ${COLORS.ice}; }
            .t-sub   { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-weight: 300; letter-spacing: 3px; fill: ${COLORS.gray}; }
            .t-mono  { font-family: "SFMono-Regular", Consolas, "Courier New", monospace; fill: ${COLORS.cyan}; }
            .t-num   { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-weight: 200; fill: ${COLORS.ice}; }
            /* No opacity here on purpose: the resting state must be a fully
               visible tower. A renderer that never advances the timeline then
               shows the field slightly low rather than showing nothing. */
            @keyframes rise { from { transform: translateY(18px); } to { transform: translateY(0); } }
            .tw { animation: rise 0.75s cubic-bezier(0.16, 0.84, 0.24, 1) both; }
            @media (prefers-reduced-motion: reduce) { .tw { animation: none; } }
        </style>
    </defs>`;
}

/* ------------------------------------------------------------------ *
 * towers — the centrepiece
 * ------------------------------------------------------------------ */

function generateTowersSvg(cal) {
    const weeks = cal.weeks;
    const GRID_W = weeks.length;          // 53
    const GRID_H = 7;

    const counts = Array.from({ length: GRID_W }, () => Array(GRID_H).fill(0));
    let max = 0;
    let activeDays = 0;
    weeks.forEach((w, wi) => {
        w.contributionDays.forEach(d => {
            counts[wi][d.weekday] = d.contributionCount;
            if (d.contributionCount > max) max = d.contributionCount;
            if (d.contributionCount > 0) activeDays++;
        });
    });
    if (max === 0) max = 1;

    const WIDTH = 1000;
    const HEIGHT = 356;
    const PAD = 0.12;

    // Anisotropic isometry: a symmetric grid turns 53x7 into a thin diagonal
    // sliver. Stretching the week axis across the canvas and letting the day
    // axis fall away to the lower-left gives a wide, shallow field that still
    // reads left-to-right like the contribution graph it is.
    const WX = 16.4, WY = 1.05;    // one week step
    const DX = -8.4, DY = 7.1;     // one day step
    const X0 = 96, Y0 = 232;

    const px = (x, y) => r2(X0 + x * WX + y * DX);
    const py = (x, y, z = 0) => r2(Y0 + x * WY + y * DY - z);

    // Compress the range so one 80-commit spike doesn't flatten everything else,
    // but a big day still visibly towers over a 1-commit day.
    const heightFor = c => (c <= 0 ? 0 : 10 + 96 * Math.pow(c / max, 0.55));

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" role="img" aria-label="${cal.totalContributions} contributions in the last year, rendered as PS2 boot towers">
  ${createDefs()}
  <rect width="100%" height="100%" fill="url(#skyFade)" />
  <ellipse cx="${WIDTH / 2}" cy="${Y0 + 30}" rx="520" ry="120" fill="url(#horizonGlow)" />
`;

    // Ground: one path for all 371 tiles instead of 371 <polygon> elements.
    let ground = '';
    for (let x = 0; x < GRID_W; x++) {
        for (let y = 0; y < GRID_H; y++) {
            ground += `M${px(x, y)},${py(x, y)}L${px(x + 1, y)},${py(x + 1, y)}` +
                `L${px(x + 1, y + 1)},${py(x + 1, y + 1)}L${px(x, y + 1)},${py(x, y + 1)}Z`;
        }
    }
    svg += `  <path d="${ground}" fill="none" stroke="#0d2440" stroke-width="0.5" opacity="0.55" />\n`;

    // Back-to-front by projected baseline, so nearer towers overlap farther ones.
    const cells = [];
    for (let x = 0; x < GRID_W; x++) {
        for (let y = 0; y < GRID_H; y++) {
            if (counts[x][y] > 0) cells.push({ x, y, c: counts[x][y], depth: py(x, y) });
        }
    }
    cells.sort((a, b) => a.depth - b.depth);

    let towers = '';
    {
        for (const { x, y, c } of cells) {
            const h = heightFor(c);
            const t = Math.pow(c / max, 0.5);           // 0..1 intensity
            const top = lerpHex(COLORS.blue, COLORS.ice, t);
            const left = lerpHex('#061c38', COLORS.deep, t);
            const right = lerpHex(COLORS.deep, COLORS.blue, t);
            const edge = lerpHex(COLORS.cyan, COLORS.white, t);

            const x1 = x + PAD, y1 = y + PAD;
            const x2 = x + 1 - PAD, y2 = y + 1 - PAD;

            const bB = [px(x1, y1), py(x1, y1)];
            const bR = [px(x2, y1), py(x2, y1)];
            const bL = [px(x1, y2), py(x1, y2)];
            const bF = [px(x2, y2), py(x2, y2)];
            const tB = [bB[0], r2(bB[1] - h)];
            const tR = [bR[0], r2(bR[1] - h)];
            const tL = [bL[0], r2(bL[1] - h)];
            const tF = [bF[0], r2(bF[1] - h)];

            // Stagger the rise left-to-right like the PS2 field filling in.
            const delay = r2(x * 0.028 + y * 0.012);

            // CSS animation, not SMIL: with animation-fill-mode "both" the
            // towers are plainly visible if the animation never runs. The old
            // SMIL version started at opacity 0, so a renderer that skipped the
            // timeline showed an empty field.
            towers += `<g class="tw" style="animation-delay:${delay}s">` +
                `<polygon points="${tL[0]},${tL[1]} ${bL[0]},${bL[1]} ${bF[0]},${bF[1]} ${tF[0]},${tF[1]}" fill="${left}"/>` +
                `<polygon points="${tR[0]},${tR[1]} ${bR[0]},${bR[1]} ${bF[0]},${bF[1]} ${tF[0]},${tF[1]}" fill="${right}"/>` +
                `<polygon points="${tB[0]},${tB[1]} ${tR[0]},${tR[1]} ${tF[0]},${tF[1]} ${tL[0]},${tL[1]}" fill="${top}"/>` +
                `<path d="M${tL[0]},${tL[1]}L${tB[0]},${tB[1]}L${tR[0]},${tR[1]}" fill="none" stroke="${edge}" stroke-width="0.7" opacity="0.85"/>` +
                `<line x1="${tF[0]}" y1="${tF[1]}" x2="${bF[0]}" y2="${bF[1]}" stroke="${edge}" stroke-width="0.6" opacity="0.5"/>` +
                `</g>\n`;
        }
    }

    // The brightest towers get a bloom pass; everything else stays crisp.
    svg += `  <g filter="url(#bloom)">\n${towers}  </g>\n`;

    const year = cal.totalContributions;
    svg += `  <text x="46" y="52" class="t-title" font-size="17">CONTRIBUTION FIELD</text>
  <text x="46" y="74" class="t-sub" font-size="10.5">LAST 365 DAYS // ${USERNAME}</text>
  <text x="${WIDTH - 46}" y="52" class="t-num" font-size="30" text-anchor="end">${year}</text>
  <text x="${WIDTH - 46}" y="72" class="t-sub" font-size="9.5" text-anchor="end">CONTRIBUTIONS · ${activeDays} ACTIVE DAYS · PEAK ${max}/DAY</text>
  <line x1="46" y1="88" x2="${WIDTH - 46}" y2="88" stroke="${COLORS.blue}" stroke-width="0.75" opacity="0.35"/>
</svg>`;

    return svg;
}

/* ------------------------------------------------------------------ *
 * header / projects / stats
 * ------------------------------------------------------------------ */

// A closed band following a sine curve. The path spans one wavelength past
// the canvas so a translateX(-lambda) loop is perfectly seamless.
function ribbonPath(W, yMid, amp, thick, lambda, phase) {
    const span = W + lambda;
    const N = Math.ceil(span / 8);
    const pts = [];
    for (let i = 0; i <= N; i++) {
        const x = (i * span) / N;
        pts.push([r2(x), r2(yMid + amp * Math.sin((2 * Math.PI * x) / lambda + phase))]);
    }
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) d += `L${pts[i][0]},${pts[i][1]}`;
    for (let i = pts.length - 1; i >= 0; i--) d += `L${pts[i][0]},${r2(pts[i][1] + thick)}`;
    return d + 'Z';
}

function generateHeaderSvg(cal) {
    const W = 1000, H = 190;

    // A low silhouette skyline built from the most recent weeks, so the header
    // and the tower field below are visibly the same world and the same data.
    const recent = cal.weeks.flatMap(w => w.contributionDays.map(d => d.contributionCount)).slice(-98);
    const peak = Math.max(1, ...recent);
    const bw = W / recent.length;
    let skyline = '';
    recent.forEach((c, i) => {
        if (c <= 0) return;
        const h = 5 + 33 * Math.pow(c / peak, 0.6);
        skyline += `<rect x="${r2(i * bw)}" y="${r2(H - h)}" width="${r2(bw - 1.6)}" height="${r2(h)}" fill="${COLORS.blue}"/>`;
    });

    // XMB-style ribbons: uniform horizontal color (any x-gradient would jump
    // at the loop seam), vertical fade so the top edge glows. CSS transform
    // only — the resting state is fully visible if the timeline never runs.
    const L1 = 500, L2 = 340;
    const rb1 = ribbonPath(W, 126, 13, 32, L1, 0.6);
    const rb2 = ribbonPath(W, 147, 9, 22, L2, 2.4);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="vibecoder37">
  ${createDefs()}
  <defs>
    <linearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${COLORS.ice}" stop-opacity="0.55" />
      <stop offset="45%" stop-color="${COLORS.cyan}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${COLORS.blue}" stop-opacity="0" />
    </linearGradient>
    <style>
      @keyframes drift1 { to { transform: translateX(-${L1}px); } }
      @keyframes drift2 { to { transform: translateX(-${L2}px); } }
      .rb1 { animation: drift1 26s linear infinite; }
      .rb2 { animation: drift2 18s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .rb1, .rb2 { animation: none; } }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="url(#skyFade)" />
  <ellipse cx="${W / 2}" cy="${H}" rx="460" ry="120" fill="url(#horizonGlow)" />
  <path class="rb1" d="${rb1}" fill="url(#ribbonGrad)" opacity="0.35" />
  <path class="rb2" d="${rb2}" fill="url(#ribbonGrad)" opacity="0.22" />
  <g opacity="0.34">${skyline}</g>
  <g filter="url(#bloom)">
    <text x="${W / 2}" y="80" class="t-title" font-size="46" text-anchor="middle">vibecoder37</text>
  </g>
  <text x="${W / 2}" y="108" class="t-sub" font-size="11" text-anchor="middle">RF · EMBEDDED · COMPUTER VISION · RUST</text>
  <line x1="${W / 2 - 150}" y1="125" x2="${W / 2 + 150}" y2="125" stroke="${COLORS.blue}" stroke-width="0.75" opacity="0.5">
    <animate attributeName="opacity" values="0.15;0.6;0.15" dur="4s" repeatCount="indefinite"/>
  </line>
  <text x="${W / 2}" y="143" class="t-sub" font-size="9.5" text-anchor="middle" style="fill:#a3bedd">IVANOVO, RU</text>
</svg>`;
}

function generateProjectsSvg(repos) {
    const W = 1000, CARD_H = 132, PAD = 18;
    const rows = Math.ceil(repos.length / 2);
    const H = 74 + rows * (CARD_H + PAD);
    const cardW = (W - PAD * 3) / 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="top projects">
  ${createDefs()}
  <rect width="100%" height="100%" fill="url(#skyFade)" />
  <text x="46" y="44" class="t-title" font-size="15">SELECTED WORK</text>
  <line x1="46" y1="58" x2="${W - 46}" y2="58" stroke="${COLORS.blue}" stroke-width="0.75" opacity="0.35"/>
`;

    repos.forEach((repo, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = PAD + col * (cardW + PAD);
        const y = 74 + row * (CARD_H + PAD);

        const words = (repo.description || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let cur = '';
        for (const w of words) {
            if ((cur + w).length > 48) { lines.push(cur.trim()); cur = w + ' '; }
            else cur += w + ' ';
        }
        if (cur.trim()) lines.push(cur.trim());
        const shown = lines.slice(0, 3);
        if (lines.length > 3) shown[2] = shown[2].slice(0, 44) + '…';

        svg += `  <g transform="translate(${x}, ${y})">
    <rect width="${cardW}" height="${CARD_H}" fill="#050b16" stroke="${COLORS.deep}" stroke-width="1"/>
    <rect width="2.5" height="${CARD_H}" fill="${COLORS.cyan}" opacity="0.75"/>
    <text x="20" y="32" class="t-title" font-size="16" style="letter-spacing:2px">${escapeHtml(repo.name)}</text>
${shown.map((l, k) => `    <text x="20" y="${56 + k * 17}" class="t-sub" font-size="11.5" style="letter-spacing:0.5px">${escapeHtml(l)}</text>`).join('\n')}
    <text x="20" y="${CARD_H - 16}" class="t-mono" font-size="11">★ ${repo.stargazers_count}</text>
    <text x="70" y="${CARD_H - 16}" class="t-mono" font-size="11" fill="${COLORS.gray}">${escapeHtml(repo.language || '—')}</text>
  </g>
`;
    });

    return svg + '</svg>';
}

function generateStatsSvg(cal, repos, user) {
    const W = 1000, H = 150;
    // Stars over every public non-fork repo, repo count from the profile
    // itself. Peak/day is not repeated here — the tower field already says it.
    const stars = repos.all.reduce((s, r) => s + r.stargazers_count, 0);
    const cells = [
        ['CONTRIBUTIONS', cal.totalContributions],
        ['STARS', stars],
        ['FOLLOWERS', user.followers],
        ['PUBLIC REPOS', user.public_repos]
    ];

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="stats">
  ${createDefs()}
  <rect width="100%" height="100%" fill="url(#skyFade)" />
  <line x1="46" y1="30" x2="${W - 46}" y2="30" stroke="${COLORS.blue}" stroke-width="0.75" opacity="0.3"/>
`;
    cells.forEach(([label, value], i) => {
        const cx = 46 + (i + 0.5) * ((W - 92) / cells.length);
        svg += `  <text x="${r2(cx)}" y="86" class="t-num" font-size="40" text-anchor="middle">${value}</text>
  <text x="${r2(cx)}" y="108" class="t-sub" font-size="9.5" text-anchor="middle">${label}</text>
`;
    });
    return svg + `  <line x1="46" y1="126" x2="${W - 46}" y2="126" stroke="${COLORS.blue}" stroke-width="0.75" opacity="0.3"/>\n</svg>`;
}

// The language field: one glowing strip, brightness by rank — the same
// cold-blue world as the towers, not a parrot of per-language brand colors.
function generateLangsSvg(langs) {
    const W = 1000, H = 112;
    const X = 46, BW = W - 92, Y = 48, BH = 12;
    const top = langs.slice(0, 6);
    const rest = 1 - top.reduce((s, l) => s + l.share, 0);
    const segs = [
        ...top.map(l => ({ label: l.name.toUpperCase(), share: l.share })),
        ...(rest > 0.005 ? [{ label: 'OTHER', share: rest }] : [])
    ];

    let x = X, bars = '';
    segs.forEach((s, i) => {
        const w = Math.max(0, s.share * BW - 2);
        const fill = s.label === 'OTHER'
            ? '#0a1d38'
            : lerpHex(COLORS.ice, COLORS.deep, segs.length <= 1 ? 0 : i / (segs.length - 1));
        bars += `<rect x="${r2(x)}" y="${Y}" width="${r2(w)}" height="${BH}" fill="${fill}"/>`;
        x += s.share * BW;
    });

    const legend = segs.map(s => `${escapeHtml(s.label)} ${(s.share * 100).toFixed(1)}%`).join('  ·  ');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Language composition across public repos: ${legend}">
  ${createDefs()}
  <defs>
    <!-- The shared bloom's ±30% region would clip the glow of a 12px-tall
         bar to ~4px; this one gives the strip real vertical headroom. -->
    <filter id="bloomBar" x="-3%" y="-300%" width="106%" height="700%">
      <feGaussianBlur stdDeviation="3.5" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#skyFade)" />
  <text x="${X}" y="30" class="t-sub" font-size="9.5">CODE COMPOSITION // PUBLIC SOURCE</text>
  <g filter="url(#bloomBar)">${bars}</g>
  <text x="${W / 2}" y="${Y + BH + 28}" class="t-sub" font-size="9.5" text-anchor="middle" style="letter-spacing:1px">${legend}</text>
</svg>`;
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */

async function main() {
    const outDir = path.join(process.cwd(), 'assets');
    await fs.mkdir(outDir, { recursive: true });

    const [repos, cal, user, langs] = await Promise.all([
        fetchRepos(), fetchContributions(), fetchUser(), fetchLanguages()
    ]);
    console.log(`repos: ${repos.all.length} public, contributions: ${cal.totalContributions}, languages: ${langs.length}`);

    const files = {
        'header.svg': generateHeaderSvg(cal),
        'towers.svg': generateTowersSvg(cal),
        'stats.svg': generateStatsSvg(cal, repos, user),
        'langs.svg': generateLangsSvg(langs),
        'projects.svg': generateProjectsSvg(repos.top)
    };

    for (const [name, content] of Object.entries(files)) {
        await fs.writeFile(path.join(outDir, name), content);
        console.log(`  ${name}  ${(content.length / 1024).toFixed(1)} KB`);
    }
}

main().catch(e => {
    console.error('generation failed:', e.message);
    process.exit(1);
});
