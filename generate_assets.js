import fs from 'fs/promises';
import path from 'path';

const USERNAME = 'bobberdolle1';
const API_URL = `https://api.github.com/users/${USERNAME}/repos?sort=stargazers&per_page=100`;

// Aesthetic colors
const COLORS = {
    bg: '#050508',
    cyan: '#00f0ff',
    magenta: '#ff007f',
    purple: '#8a2be2',
    white: '#ffffff',
    gray: '#555566',
    darkGray: '#111116'
};

async function fetchRepos() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        const data = await res.json();
        return data
            .filter(repo => !repo.fork && repo.name !== USERNAME)
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 6); // top 6 projects
    } catch (e) {
        console.error(e);
        // Fallback data if API fails (e.g., rate limit)
        return [
            { name: 'SkySweep32', description: 'Multi-band passive drone detector on ESP32 | 900MHz/2.4GHz/5.8GHz RF scanner', stargazers_count: 25, language: 'C++' },
            { name: 'openflash', description: 'NAND/eMMC/NOR flash programmer for budget MCUs', stargazers_count: 14, language: 'Rust' },
            { name: 'unbound', description: 'Универсальный обход DPI на уровне пакетов. Без VPN-туннелей.', stargazers_count: 6, language: 'Lua' },
            { name: 'maixcam-servo-control', description: 'Advanced AI-powered autonomous ballistic servo drop system for MaixCAM', stargazers_count: 2, language: 'Python' },
            { name: 'maixcam-wildtrap', description: 'AI-Powered Camera Trap for MaixCAM | Hybrid Motion+YOLOv8 Detection', stargazers_count: 1, language: 'Python' },
            { name: 'GyroChad', description: 'AI-Powered FPV Drone Assistant - Telegram bot with RAG, Vision, and Blackbox', stargazers_count: 1, language: 'Rust' }
        ];
    }
}

function escapeHtml(unsafe) {
    return (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function createGlitchFilters() {
    return `
    <defs>
        <filter id="glitch">
            <feTurbulence type="fractalNoise" baseFrequency="0.05 0.95" numOctaves="1" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 3 -1" in="noise" result="coloredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="coloredNoise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${COLORS.cyan}" />
            <stop offset="50%" stop-color="${COLORS.purple}" />
            <stop offset="100%" stop-color="${COLORS.magenta}" />
        </linearGradient>
        <style>
            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
            @keyframes glitch-anim {
                0% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 2px); }
                20% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
                40% { clip-path: inset(50% 0 30% 0); transform: translate(-2px, 0); }
                60% { clip-path: inset(0 0 100% 0); transform: translate(2px, 2px); }
                80% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, -2px); }
                100% { clip-path: inset(40% 0 40% 0); transform: translate(2px, 0); }
            }
            .scanlines {
                fill: url(#scanPattern);
                opacity: 0.15;
            }
            .glitch-text {
                font-family: monospace, "Courier New";
                font-weight: bold;
                font-size: 48px;
                fill: ${COLORS.white};
            }
            .glitch-red {
                fill: ${COLORS.magenta};
                animation: glitch-anim 2s infinite linear alternate-reverse;
            }
            .glitch-blue {
                fill: ${COLORS.cyan};
                animation: glitch-anim 3s infinite linear alternate-reverse;
            }
            .text-title { font-family: monospace; font-size: 20px; fill: ${COLORS.cyan}; font-weight: bold; }
            .text-sub { font-family: monospace; font-size: 14px; fill: ${COLORS.gray}; }
            .text-desc { font-family: monospace; font-size: 13px; fill: ${COLORS.white}; }
            .text-stat { font-family: monospace; font-size: 12px; fill: ${COLORS.magenta}; }
            
            .window { fill: ${COLORS.darkGray}; stroke: ${COLORS.gray}; stroke-width: 2; }
            .window-header { fill: ${COLORS.gray}; }
            .window-dot-red { fill: ${COLORS.magenta}; }
            .window-dot-yellow { fill: #ffff00; }
            .window-dot-green { fill: ${COLORS.cyan}; }
            
            .star-icon { fill: ${COLORS.cyan}; }
            
            .grid-bg { stroke: rgba(255, 255, 255, 0.05); stroke-width: 1; }
        </style>
        <pattern id="scanPattern" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="1" fill="${COLORS.white}" />
        </pattern>
        <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none" class="grid-bg" />
            <path d="M 40 0 L 0 0 0 40" fill="none" class="grid-bg" />
        </pattern>
    </defs>
    `;
}

function generateHeaderSvg() {
    const width = 800;
    const height = 200;
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${createGlitchFilters()}
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="${COLORS.bg}" />
    <rect width="100%" height="100%" fill="url(#gridPattern)" />
    
    <!-- Decorative Elements -->
    <path d="M 0,100 L 150,100 L 170,120 L 630,120 L 650,100 L 800,100" stroke="${COLORS.cyan}" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M 0,110 L 145,110 L 165,130 L 635,130 L 655,110 L 800,110" stroke="${COLORS.magenta}" stroke-width="1" fill="none" opacity="0.3"/>
    
    <!-- Glitching Title -->
    <g transform="translate(400, 100)" text-anchor="middle">
        <text class="glitch-text glitch-red" x="2" y="-2">bobberdolle1</text>
        <text class="glitch-text glitch-blue" x="-2" y="2">bobberdolle1</text>
        <text class="glitch-text" x="0" y="0">bobberdolle1</text>
    </g>
    
    <!-- Subtitle -->
    <text x="400" y="145" class="text-sub" text-anchor="middle" fill="${COLORS.white}">SYS.HACKER // RF // EMBEDDED // CV</text>
    
    <!-- Scanlines -->
    <rect width="100%" height="100%" class="scanlines" />
</svg>
    `.trim();
}

function generateProjectsSvg(repos) {
    const width = 800;
    const cardHeight = 180;
    const padding = 20;
    const rows = Math.ceil(repos.length / 2);
    const height = rows * cardHeight + (rows + 1) * padding + 80;
    
    let svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${createGlitchFilters()}
    <style>
        .window-group { cursor: pointer; }
        .window-group:hover .window { stroke: ${COLORS.magenta}; stroke-width: 3; }
        .window-group:hover .text-title { fill: ${COLORS.magenta}; }
        .window-group:hover .window-header { fill: ${COLORS.magenta}; opacity: 0.3; }
    </style>
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="${COLORS.bg}" />
    <rect width="100%" height="100%" fill="url(#gridPattern)" />
    
    <!-- Title -->
    <text x="400" y="40" class="text-title" text-anchor="middle">>> TOP_DIRECTORIES</text>
    <path d="M 250,50 L 550,50" stroke="${COLORS.magenta}" stroke-width="2" fill="none"/>
    <path d="M 260,55 L 540,55" stroke="${COLORS.cyan}" stroke-width="1" fill="none"/>
    `;
    
    repos.forEach((repo, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const cardWidth = (width - padding * 3) / 2;
        const x = padding + col * (cardWidth + padding);
        const y = 80 + row * (cardHeight + padding);
        
        let desc = repo.description || '';
        
        // Better word wrap into up to 5 lines
        const words = desc.split(' ');
        let lines = [];
        let currentLine = '';
        words.forEach(word => {
            if ((currentLine + word).length > 42) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        lines.push(currentLine.trim());
        if (lines.length > 5) {
            lines = lines.slice(0, 5);
            lines[4] = lines[4].substring(0, 38) + '...';
        }
        
        svg += `
    <!-- Project Card Window -->
    <g transform="translate(${x}, ${y})" class="window-group">
        <rect width="${cardWidth}" height="${cardHeight}" class="window" style="transition: all 0.3s;" />
        <rect width="${cardWidth}" height="20" class="window-header" style="transition: all 0.3s;" />
        <circle cx="10" cy="10" r="4" class="window-dot-red" />
        <circle cx="25" cy="10" r="4" class="window-dot-yellow" />
        <circle cx="40" cy="10" r="4" class="window-dot-green" />
        
        <text x="55" y="14" class="text-sub" fill="${COLORS.bg}">~/${escapeHtml(repo.name)}</text>
        
        <!-- Repo Name -->
        <text x="15" y="45" class="text-title" style="transition: fill 0.3s;">${escapeHtml(repo.name)}</text>
        
        <!-- Description -->
        ${lines[0] ? `<text x="15" y="65" class="text-desc">${escapeHtml(lines[0])}</text>` : ''}
        ${lines[1] ? `<text x="15" y="82" class="text-desc">${escapeHtml(lines[1])}</text>` : ''}
        ${lines[2] ? `<text x="15" y="99" class="text-desc">${escapeHtml(lines[2])}</text>` : ''}
        ${lines[3] ? `<text x="15" y="116" class="text-desc">${escapeHtml(lines[3])}</text>` : ''}
        ${lines[4] ? `<text x="15" y="133" class="text-desc">${escapeHtml(lines[4])}</text>` : ''}
        
        <!-- Stars and Language -->
        <text x="15" y="165" class="text-stat">[★ ${repo.stargazers_count}]</text>
        <text x="80" y="165" class="text-stat">[<span style="color:${COLORS.purple}">$</span> ${escapeHtml(repo.language || 'Unknown')}]</text>
        
        <path d="M 0,${cardHeight-2} L ${cardWidth},${cardHeight-2}" stroke="${COLORS.magenta}" stroke-width="2" opacity="0.5"/>
        
        <!-- Interactive Overlay (to catch hover events better) -->
        <rect width="${cardWidth}" height="${cardHeight}" fill="transparent" />
    </g>
        `;
    });
    
    svg += `
    <rect width="100%" height="100%" class="scanlines" pointer-events="none" />
</svg>
    `;
    return svg.trim();
}

function generateStatsSvg() {
    const width = 800;
    const height = 250;
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${createGlitchFilters()}
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="${COLORS.bg}" />
    <rect width="100%" height="100%" fill="url(#gridPattern)" />
    
    <g transform="translate(40, 30)">
        <rect width="720" height="190" class="window" />
        <rect width="720" height="20" class="window-header" />
        <circle cx="10" cy="10" r="4" class="window-dot-red" />
        <circle cx="25" cy="10" r="4" class="window-dot-yellow" />
        <circle cx="40" cy="10" r="4" class="window-dot-green" />
        <text x="55" y="14" class="text-sub" fill="${COLORS.bg}">sys.diag // EXEC</text>
        
        <text x="20" y="50" class="text-desc" fill="${COLORS.cyan}">> INITIALIZING SYSTEM SCANS...</text>
        <text x="20" y="70" class="text-stat">[OK] <tspan fill="${COLORS.white}">HARDWARE: ESP32, RP2040, CC1101, NRF24</tspan></text>
        <text x="20" y="90" class="text-stat">[OK] <tspan fill="${COLORS.white}">LANGUAGES : Rust, Python, C++, Lua</tspan></text>
        <text x="20" y="110" class="text-stat">[OK] <tspan fill="${COLORS.white}">DOMAIN    : Computer Vision, Embedded, DPI-Bypass</tspan></text>
        
        <!-- Animated progress bar -->
        <rect x="20" y="130" width="680" height="10" fill="${COLORS.darkGray}" stroke="${COLORS.gray}"/>
        <rect x="20" y="130" width="0" height="10" fill="${COLORS.magenta}">
            <animate attributeName="width" values="0; 680; 680" keyTimes="0; 0.8; 1" dur="4s" repeatCount="indefinite" />
        </rect>
        <text x="20" y="160" class="text-title" fill="${COLORS.cyan}">SYSTEM ONLINE_</text>
        <rect x="175" y="148" width="10" height="15" fill="${COLORS.cyan}">
            <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
        </rect>
    </g>
    
    <rect width="100%" height="100%" class="scanlines" pointer-events="none" />
</svg>
    `.trim();
}

async function generateTowersSvg() {
    const USERNAME = 'bobberdolle1';
    const url = `https://github.com/users/${USERNAME}/contributions`;
    
    let html = '';
    try {
        const res = await fetch(url);
        html = await res.text();
    } catch (e) {
        console.error('Error fetching contributions:', e);
    }
    
    let days = [];
    const re1 = /data-date="([^"]+)"[^>]*data-level="([^"]+)"/g;
    let match;
    while ((match = re1.exec(html)) !== null) {
        days.push([match[1], parseInt(match[2], 10)]);
    }
    
    if (days.length === 0) {
        const re2 = /data-count="([^"]+)"[^>]*data-date="([^"]+)"/g;
        while ((match = re2.exec(html)) !== null) {
            days.push([match[2], parseInt(match[1], 10) > 0 ? Math.min(4, Math.ceil(parseInt(match[1], 10)/5)) : 0]);
        }
    }
    
    if (days.length === 0) {
        for(let i=0; i<364; i++) days.push(["2026-01-01", 0]);
    }
    
    const last364 = days.slice(-364);
    
    const GRID_W = 52;
    const GRID_H = 7;
    const grid = Array.from({length: GRID_W}, () => Array(GRID_H).fill(0));
    
    last364.forEach(([date, level], idx) => {
        const w = Math.floor(idx / 7);
        const d = idx % 7;
        if (w < GRID_W && d < GRID_H) {
            grid[w][d] = level;
        }
    });
    
    const WIDTH = 1000;
    const HEIGHT = 500;
    const CELL_W = 12;
    const CELL_H = 6;
    const PAD = 0.15;
    
    const TOWER_COLORS = {
        1: { top: "#0088ff", left: "#003388", right: "#0055cc", edge: "#00f0ff", h: 12 },
        2: { top: "#00ddff", left: "#006688", right: "#0099cc", edge: "#00f0ff", h: 28 },
        3: { top: "#aa55ff", left: "#441188", right: "#6622bb", edge: "#ff007f", h: 50 },
        4: { top: "#ff33cc", left: "#880055", right: "#cc1199", edge: "#ff007f", h: 85 }
    };
    
    function project(x, y, z) {
        const x0 = WIDTH / 2;
        const y0 = 300;
        const iso_x = x0 + (x - y) * CELL_W;
        const iso_y = y0 + (x + y) * CELL_H - z;
        return [iso_x, iso_y];
    }
    
    let svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="100%">
  ${createGlitchFilters()}
  <style>
    .tower-group { cursor: pointer; }
    .tower-group:hover polygon { stroke: #fff; stroke-width: 1.5; filter: drop-shadow(0 0 8px #ff007f); }
    .tower-group:hover line { stroke: #fff; stroke-width: 2; }
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" fill="${COLORS.bg}" />
  <rect width="100%" height="100%" fill="url(#gridPattern)" />
  
  <!-- Window Frame -->
  <rect x="20" y="20" width="960" height="560" fill="none" stroke="${COLORS.gray}" stroke-width="2" />
  <rect x="20" y="20" width="960" height="25" fill="${COLORS.darkGray}" />
  <circle cx="35" cy="32" r="5" fill="#ff5f56" />
  <circle cx="55" cy="32" r="5" fill="#ffbd2e" />
  <circle cx="75" cy="32" r="5" fill="#27c93f" />
  <text x="90" y="37" font-family="Courier New, monospace" font-size="14" fill="${COLORS.cyan}">~/commits</text>
  
  <!-- Title -->
  <text x="500" y="80" font-family="Courier New, monospace" font-size="24" font-weight="bold" fill="${COLORS.cyan}" text-anchor="middle">>> COMMIT_ACTIVITY</text>
  <path d="M 350,90 L 650,90" stroke="${COLORS.magenta}" stroke-width="2" fill="none"/>

  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#004488" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${COLORS.bg}" stop-opacity="0" />
    </radialGradient>
  </defs>
  
  <g transform="translate(0, 50)" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="500" cy="380" rx="450" ry="120" fill="url(#glow)" />
`;

    const x_off = -26;
    const y_off = -3.5;
    
    // 1. Base grid
    for (let depth = 0; depth < GRID_W + GRID_H - 1; depth++) {
        for (let x = 0; x < GRID_W; x++) {
            const y = depth - x;
            if (y >= 0 && y < GRID_H) {
                const px = x + x_off;
                const py = y + y_off;
                const gb = project(px, py, 0);
                const gr = project(px + 1, py, 0);
                const gl = project(px, py + 1, 0);
                const gf = project(px + 1, py + 1, 0);
                svg += `    <polygon points="${gb[0]},${gb[1]} ${gr[0]},${gr[1]} ${gf[0]},${gf[1]} ${gl[0]},${gl[1]}" fill="${COLORS.darkGray}" stroke="${COLORS.gray}" stroke-width="0.75" />\\n`;
            }
        }
    }
    
    // 2. Columns
    for (let depth = 0; depth < GRID_W + GRID_H - 1; depth++) {
        for (let x = 0; x < GRID_W; x++) {
            const y = depth - x;
            if (y >= 0 && y < GRID_H) {
                const lvl = grid[x][y];
                if (lvl > 0 && TOWER_COLORS[lvl]) {
                    const c = TOWER_COLORS[lvl];
                    const h = c.h;
                    
                    const px1 = x + x_off + PAD;
                    const py1 = y + y_off + PAD;
                    const px2 = x + x_off + 1 - PAD;
                    const py2 = y + y_off + 1 - PAD;
                    
                    const b_back = project(px1, py1, 0);
                    const b_right = project(px2, py1, 0);
                    const b_left = project(px1, py2, 0);
                    const b_front = project(px2, py2, 0);
                    
                    const t_back = project(px1, py1, h);
                    const t_right = project(px2, py1, h);
                    const t_left = project(px1, py2, h);
                    const t_front = project(px2, py2, h);
                    
                    const delay = (x + y) * 0.02;
                    const ease = 'calcMode="spline" keySplines="0.25 0.1 0.25 1"';
                    
                    const base_left = `${b_left[0]},${b_left[1]} ${b_left[0]},${b_left[1]} ${b_front[0]},${b_front[1]} ${b_front[0]},${b_front[1]}`;
                    const full_left = `${t_left[0]},${t_left[1]} ${b_left[0]},${b_left[1]} ${b_front[0]},${b_front[1]} ${t_front[0]},${t_front[1]}`;
                    
                    const base_right = `${b_right[0]},${b_right[1]} ${b_right[0]},${b_right[1]} ${b_front[0]},${b_front[1]} ${b_front[0]},${b_front[1]}`;
                    const full_right = `${t_right[0]},${t_right[1]} ${b_right[0]},${b_right[1]} ${b_front[0]},${b_front[1]} ${t_front[0]},${t_front[1]}`;
                    
                    const base_top = `${b_back[0]},${b_back[1]} ${b_right[0]},${b_right[1]} ${b_front[0]},${b_front[1]} ${b_left[0]},${b_left[1]}`;
                    const full_top = `${t_back[0]},${t_back[1]} ${t_right[0]},${t_right[1]} ${t_front[0]},${t_front[1]} ${t_left[0]},${t_left[1]}`;
                    
                    svg += `
    <g class="tower-group">
      <title>Date: ${date} | Commits: ${level}</title>
      <polygon points="${base_left}" fill="${c.left}" opacity="0.9">
        <animate attributeName="points" values="${base_left};${full_left}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
      </polygon>
      <polygon points="${base_right}" fill="${c.right}" opacity="0.9">
        <animate attributeName="points" values="${base_right};${full_right}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
      </polygon>
      <polygon points="${base_top}" fill="${c.top}" opacity="1.0">
        <animate attributeName="points" values="${base_top};${full_top}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
      </polygon>
      <polygon points="${base_top}" fill="none" stroke="${c.edge}" stroke-width="1.0" opacity="0.9">
        <animate attributeName="points" values="${base_top};${full_top}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
      </polygon>
      <line x1="${b_left[0]}" y1="${b_left[1]}" x2="${b_left[0]}" y2="${b_left[1]}" stroke="${c.edge}" stroke-width="1.2" opacity="0.9">
        <animate attributeName="x1" values="${b_left[0]};${t_left[0]}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
        <animate attributeName="y1" values="${b_left[1]};${t_left[1]}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
      </line>
      <line x1="${b_right[0]}" y1="${b_right[1]}" x2="${b_right[0]}" y2="${b_right[1]}" stroke="${c.edge}" stroke-width="1.2" opacity="0.9">
        <animate attributeName="x1" values="${b_right[0]};${t_right[0]}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
        <animate attributeName="y1" values="${b_right[1]};${t_right[1]}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
      </line>
      <line x1="${b_front[0]}" y1="${b_front[1]}" x2="${b_front[0]}" y2="${b_front[1]}" stroke="${c.edge}" stroke-width="1.2" opacity="0.9">
        <animate attributeName="x1" values="${b_front[0]};${t_front[0]}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
        <animate attributeName="y1" values="${b_front[1]};${t_front[1]}" begin="${delay}s" dur="0.8s" fill="freeze" ${ease} />
      </line>
    </g>`;
                }
            }
        }
    }
    
    svg += `\n  </g>
  <rect width="100%" height="100%" class="scanlines" pointer-events="none" />
</svg>`;
    return svg;
}

async function main() {
    try {
        console.log('Fetching repositories...');
        const repos = await fetchRepos();
        console.log(`Found ${repos.length} repos to display.`);
        
        const outDir = path.join(process.cwd(), 'assets');
        await fs.mkdir(outDir, { recursive: true });
        
        console.log('Generating header.svg...');
        await fs.writeFile(path.join(outDir, 'header.svg'), generateHeaderSvg());
        
        console.log('Generating projects.svg...');
        await fs.writeFile(path.join(outDir, 'projects.svg'), generateProjectsSvg(repos));
        
        console.log('Generating stats.svg...');
        await fs.writeFile(path.join(outDir, 'stats.svg'), generateStatsSvg());
        
        console.log('Generating ps2_towers.svg (from GitHub contributions)...');
        await fs.writeFile(path.join(outDir, 'ps2_towers.svg'), await generateTowersSvg());
        
        console.log('Assets successfully generated!');
    } catch (e) {
        console.error('Error in generation script:', e);
        process.exit(1);
    }
}

main();
