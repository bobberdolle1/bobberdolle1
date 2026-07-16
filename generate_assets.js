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
    const cardHeight = 120;
    const padding = 20;
    const rows = Math.ceil(repos.length / 2);
    const height = rows * cardHeight + (rows + 1) * padding + 80;
    
    let svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${createGlitchFilters()}
    
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
        
        let desc = escapeHtml(repo.description);
        // Truncate desc if too long
        if (desc.length > 75) desc = desc.substring(0, 72) + '...';
        
        // Break description into two lines
        let descLine1 = desc;
        let descLine2 = '';
        if (desc.length > 40) {
            const splitIndex = desc.lastIndexOf(' ', 40);
            if (splitIndex > 0) {
                descLine1 = desc.substring(0, splitIndex);
                descLine2 = desc.substring(splitIndex + 1);
            }
        }
        
        svg += `
    <!-- Project Card Window -->
    <g transform="translate(${x}, ${y})">
        <rect width="${cardWidth}" height="${cardHeight}" class="window" />
        <rect width="${cardWidth}" height="20" class="window-header" />
        <circle cx="10" cy="10" r="4" class="window-dot-red" />
        <circle cx="25" cy="10" r="4" class="window-dot-yellow" />
        <circle cx="40" cy="10" r="4" class="window-dot-green" />
        
        <text x="55" y="14" class="text-sub" fill="${COLORS.bg}">~/${escapeHtml(repo.name)}</text>
        
        <!-- Repo Name -->
        <text x="15" y="45" class="text-title" fill="${COLORS.cyan}">${escapeHtml(repo.name)}</text>
        
        <!-- Description -->
        <text x="15" y="65" class="text-desc">${descLine1}</text>
        <text x="15" y="82" class="text-desc">${descLine2}</text>
        
        <!-- Stars and Language -->
        <text x="15" y="105" class="text-stat">[★ ${repo.stargazers_count}]</text>
        <text x="80" y="105" class="text-stat">[<span style="color:${COLORS.purple}">$</span> ${escapeHtml(repo.language || 'Unknown')}]</text>
        
        <path d="M 0,${cardHeight-2} L ${cardWidth},${cardHeight-2}" stroke="${COLORS.magenta}" stroke-width="2" opacity="0.5"/>
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
        
        console.log('Assets successfully generated!');
    } catch (e) {
        console.error('Error in generation script:', e);
        process.exit(1);
    }
}

main();
