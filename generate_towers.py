import urllib.request
import re
import os

url = 'https://github.com/users/bobberdolle1/contributions'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    days = re.findall(r'data-date="([^"]+)"[^>]*data-level="([^"]+)"', html)
    if not days:
        days = re.findall(r'data-count="([^"]+)"[^>]*data-date="([^"]+)"', html)
        days = [(d, c) for c, d in days]
except Exception as e:
    days = []

if not days:
    days = [("2026-01-01", "0") for _ in range(364)]

last_364 = days[-364:]

GRID_W = 52
GRID_H = 7
grid = [[0 for _ in range(GRID_H)] for _ in range(GRID_W)]

for idx, (date, level_str) in enumerate(last_364):
    w = idx // 7
    d = idx % 7
    if w < GRID_W and d < GRID_H:
        grid[w][d] = int(level_str)

WIDTH = 1000
HEIGHT = 500
CELL_W = 12
CELL_H = 6
PAD = 0.15 # Padding around each column inside its cell

COLORS = {
    1: {"top": "#0088ff", "left": "#003388", "right": "#0055cc", "edge": "#88ccff", "h": 12},
    2: {"top": "#00ddff", "left": "#006688", "right": "#0099cc", "edge": "#aaffff", "h": 28},
    3: {"top": "#aa55ff", "left": "#441188", "right": "#6622bb", "edge": "#ddaaff", "h": 50},
    4: {"top": "#ff33cc", "left": "#880055", "right": "#cc1199", "edge": "#ff99ee", "h": 85}
}

def project(x, y, z):
    # center is at (WIDTH/2, HEIGHT/2 + 50) to perfectly fit the grid
    x0 = WIDTH / 2
    y0 = 300
    iso_x = x0 + (x - y) * CELL_W
    iso_y = y0 + (x + y) * CELL_H - z
    return iso_x, iso_y

svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 0 800 500" width="100%">',
    '  <!-- Dark Space Background -->',
    '  <rect x="-1000" y="-1000" width="5000" height="5000" fill="#020203" />',
    '  <defs>',
    '    <radialGradient id="glow" cx="50%" cy="50%" r="50%">',
    '      <stop offset="0%" stop-color="#004488" stop-opacity="0.3" />',
    '      <stop offset="100%" stop-color="#020203" stop-opacity="0" />',
    '    </radialGradient>',
    '  </defs>',
    '  <ellipse cx="500" cy="380" rx="450" ry="120" fill="url(#glow)" />',
    '  <g stroke-linejoin="round" stroke-linecap="round">'
]

x_off = -26
y_off = -3.5

# 1. DRAW ENTIRE BASE GRID FIRST (Painter's algo for base)
for depth in range(GRID_W + GRID_H - 1):
    for x in range(GRID_W):
        y = depth - x
        if 0 <= y < GRID_H:
            px = x + x_off
            py = y + y_off
            # Grid cells
            gb = project(px, py, 0)
            gr = project(px+1, py, 0)
            gl = project(px, py+1, 0)
            gf = project(px+1, py+1, 0)
            
            # Floor tile
            svg.append(f'    <polygon points="{gb[0]},{gb[1]} {gr[0]},{gr[1]} {gf[0]},{gf[1]} {gl[0]},{gl[1]}" fill="#050507" stroke="#1a1a24" stroke-width="0.75" />')

# 2. DRAW COLUMNS FROM BACK TO FRONT
for depth in range(GRID_W + GRID_H - 1):
    for x in range(GRID_W):
        y = depth - x
        if 0 <= y < GRID_H:
            lvl = grid[x][y]
            if lvl > 0:
                c = COLORS[lvl]
                h = c["h"]
                
                px1 = x + x_off + PAD
                py1 = y + y_off + PAD
                px2 = x + x_off + 1 - PAD
                py2 = y + y_off + 1 - PAD
                
                # Base corners (for animation start state)
                b_back = project(px1, py1, 0)
                b_right = project(px2, py1, 0)
                b_left = project(px1, py2, 0)
                b_front = project(px2, py2, 0)
                
                # Top corners (for animation end state)
                t_back = project(px1, py1, h)
                t_right = project(px2, py1, h)
                t_left = project(px1, py2, h)
                t_front = project(px2, py2, h)
                
                # Animation strings
                delay = (x + y) * 0.02
                ease = 'calcMode="spline" keySplines="0.25 0.1 0.25 1"'
                
                base_left = f'{b_left[0]},{b_left[1]} {b_left[0]},{b_left[1]} {b_front[0]},{b_front[1]} {b_front[0]},{b_front[1]}'
                full_left = f'{t_left[0]},{t_left[1]} {b_left[0]},{b_left[1]} {b_front[0]},{b_front[1]} {t_front[0]},{t_front[1]}'
                
                base_right = f'{b_right[0]},{b_right[1]} {b_right[0]},{b_right[1]} {b_front[0]},{b_front[1]} {b_front[0]},{b_front[1]}'
                full_right = f'{t_right[0]},{t_right[1]} {b_right[0]},{b_right[1]} {b_front[0]},{b_front[1]} {t_front[0]},{t_front[1]}'
                
                base_top = f'{b_back[0]},{b_back[1]} {b_right[0]},{b_right[1]} {b_front[0]},{b_front[1]} {b_left[0]},{b_left[1]}'
                full_top = f'{t_back[0]},{t_back[1]} {t_right[0]},{t_right[1]} {t_front[0]},{t_front[1]} {t_left[0]},{t_left[1]}'
                
                # Left Face
                svg.append(f'    <polygon points="{base_left}" fill="{c["left"]}" opacity="0.9">')
                svg.append(f'      <animate attributeName="points" values="{base_left};{full_left}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append('    </polygon>')
                
                # Right Face
                svg.append(f'    <polygon points="{base_right}" fill="{c["right"]}" opacity="0.9">')
                svg.append(f'      <animate attributeName="points" values="{base_right};{full_right}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append('    </polygon>')
                
                # Top Face
                svg.append(f'    <polygon points="{base_top}" fill="{c["top"]}" opacity="1.0">')
                svg.append(f'      <animate attributeName="points" values="{base_top};{full_top}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append('    </polygon>')
                
                # Edges (Neon wireframe)
                svg.append(f'    <polygon points="{base_top}" fill="none" stroke="{c["edge"]}" stroke-width="1.0" opacity="0.9">')
                svg.append(f'      <animate attributeName="points" values="{base_top};{full_top}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append('    </polygon>')
                
                svg.append(f'    <line x1="{b_left[0]}" y1="{b_left[1]}" x2="{b_left[0]}" y2="{b_left[1]}" stroke="{c["edge"]}" stroke-width="1.2" opacity="0.9">')
                svg.append(f'      <animate attributeName="x1" values="{b_left[0]};{t_left[0]}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append(f'      <animate attributeName="y1" values="{b_left[1]};{t_left[1]}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append('    </line>')
                
                svg.append(f'    <line x1="{b_right[0]}" y1="{b_right[1]}" x2="{b_right[0]}" y2="{b_right[1]}" stroke="{c["edge"]}" stroke-width="1.2" opacity="0.9">')
                svg.append(f'      <animate attributeName="x1" values="{b_right[0]};{t_right[0]}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append(f'      <animate attributeName="y1" values="{b_right[1]};{t_right[1]}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append('    </line>')
                
                svg.append(f'    <line x1="{b_front[0]}" y1="{b_front[1]}" x2="{b_front[0]}" y2="{b_front[1]}" stroke="{c["edge"]}" stroke-width="1.2" opacity="0.9">')
                svg.append(f'      <animate attributeName="x1" values="{b_front[0]};{t_front[0]}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append(f'      <animate attributeName="y1" values="{b_front[1]};{t_front[1]}" begin="{delay}s" dur="0.8s" fill="freeze" {ease} />')
                svg.append('    </line>')

svg.append('  </g>')
svg.append('</svg>')

os.makedirs('assets', exist_ok=True)
with open('assets/ps2_towers.svg', 'w') as f:
    f.write('\n'.join(svg))

print("Successfully generated true 3D isometric PS2 towers SVG")
