import urllib.request
import re
import os

# Fetch contribution HTML
url = 'https://github.com/users/bobberdolle1/contributions'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    days = re.findall(r'data-date="([^"]+)"[^>]*data-level="([^"]+)"', html)
    if not days:
        days = re.findall(r'data-count="([^"]+)"[^>]*data-date="([^"]+)"', html)
        days = [(d, c) for c, d in days]
except Exception as e:
    print("Failed to fetch contribution data:", e)
    days = []

if not days:
    print("Using fallback mock data")
    days = [("2026-01-01", "0") for _ in range(364)]

last_364 = days[-364:]

GRID_W = 52
GRID_H = 7
grid = [[0 for _ in range(GRID_H)] for _ in range(GRID_W)]

for idx, (date, level_str) in enumerate(last_364):
    week = idx // 7
    day = idx % 7
    if week < GRID_W and day < GRID_H:
        grid[week][day] = int(level_str)

WIDTH = 1000
HEIGHT = 500
CELL_WIDTH = 12
CELL_HEIGHT = 6
GAP = 0.25 # Adds a gap between columns
W = 1.0 - GAP

COLORS = {
    0: {"top": "rgba(20,20,20,0.5)", "left": "rgba(10,10,10,0.5)", "right": "rgba(15,15,15,0.5)", "line": "rgba(40,40,40,0.3)", "height": 1},
    1: {"top": "url(#top1)", "left": "url(#left1)", "right": "url(#right1)", "line": "rgba(0,162,243,0.8)", "height": 10},
    2: {"top": "url(#top2)", "left": "url(#left2)", "right": "url(#right2)", "line": "rgba(0,212,255,0.9)", "height": 30},
    3: {"top": "url(#top3)", "left": "url(#left3)", "right": "url(#right3)", "line": "rgba(92,240,255,1.0)", "height": 60},
    4: {"top": "url(#top4)", "left": "url(#left4)", "right": "url(#right4)", "line": "rgba(179,102,255,1.0)", "height": 100}
}

def project(x, y, z):
    x0 = WIDTH / 2
    y0 = HEIGHT - 90
    iso_x = x0 + (x - y) * CELL_WIDTH
    iso_y = y0 + (x + y) * CELL_HEIGHT - z
    return iso_x, iso_y

svg_content = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="100%">',
    '  <!-- Deep Dark Space Background -->',
    '  <rect width="100%" height="100%" fill="#000000" />',
    '  <defs>',
    '    <!-- Floor glow -->',
    '    <radialGradient id="floorGlow" cx="50%" cy="50%" r="50%">',
    '      <stop offset="0%" stop-color="#002b42" stop-opacity="0.3" />',
    '      <stop offset="100%" stop-color="#000000" stop-opacity="0" />',
    '    </radialGradient>',
    '    <!-- Linear Gradients for 3D Faces -->',
    '    <linearGradient id="top1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#005f8c" stop-opacity="0.9"/><stop offset="100%" stop-color="#002d42" stop-opacity="0.7"/></linearGradient>',
    '    <linearGradient id="left1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#003d5c" stop-opacity="0.8"/><stop offset="100%" stop-color="#00131f" stop-opacity="0.5"/></linearGradient>',
    '    <linearGradient id="right1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#005580" stop-opacity="0.8"/><stop offset="100%" stop-color="#001e30" stop-opacity="0.5"/></linearGradient>',
    
    '    <linearGradient id="top2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00a2f3" stop-opacity="0.9"/><stop offset="100%" stop-color="#005580" stop-opacity="0.7"/></linearGradient>',
    '    <linearGradient id="left2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0077c2" stop-opacity="0.8"/><stop offset="100%" stop-color="#002b42" stop-opacity="0.5"/></linearGradient>',
    '    <linearGradient id="right2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0088cc" stop-opacity="0.8"/><stop offset="100%" stop-color="#003d5c" stop-opacity="0.5"/></linearGradient>',
    
    '    <linearGradient id="top3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5cf0ff" stop-opacity="0.9"/><stop offset="100%" stop-color="#00d4ff" stop-opacity="0.7"/></linearGradient>',
    '    <linearGradient id="left3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#00a2f3" stop-opacity="0.8"/><stop offset="100%" stop-color="#005f9e" stop-opacity="0.5"/></linearGradient>',
    '    <linearGradient id="right3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#00bfff" stop-opacity="0.8"/><stop offset="100%" stop-color="#0077c2" stop-opacity="0.5"/></linearGradient>',
    
    '    <linearGradient id="top4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#b366ff" stop-opacity="0.9"/><stop offset="100%" stop-color="#8000ff" stop-opacity="0.7"/></linearGradient>',
    '    <linearGradient id="left4" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#8c1aff" stop-opacity="0.8"/><stop offset="100%" stop-color="#330066" stop-opacity="0.5"/></linearGradient>',
    '    <linearGradient id="right4" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#9933ff" stop-opacity="0.8"/><stop offset="100%" stop-color="#4d0099" stop-opacity="0.5"/></linearGradient>',
    '  </defs>',
    '  <ellipse cx="500" cy="350" rx="400" ry="150" fill="url(#floorGlow)" />'
]

x_offset = -26
y_offset = -3.5

# Render from back to front
for depth in range(GRID_W + GRID_H - 1):
    for x in range(GRID_W):
        y = depth - x
        if 0 <= y < GRID_H:
            level = grid[x][y]
            color = COLORS[level]
            h = color["height"]
            
            px = x + x_offset
            py = y + y_offset
            
            b_top = project(px, py, 0)
            b_left = project(px + W, py, 0)
            b_right = project(px, py + W, 0)
            b_bottom = project(px + W, py + W, 0)
            
            t_top = project(px, py, h)
            t_left = project(px + W, py, h)
            t_right = project(px, py + W, h)
            t_bottom = project(px + W, py + W, h)
            
            # Left Face
            svg_content.append(
                f'  <polygon points="{b_left[0]},{b_left[1]} {b_bottom[0]},{b_bottom[1]} {t_bottom[0]},{t_bottom[1]} {t_left[0]},{t_left[1]}" '
                f'fill="{color["left"]}" />'
            )
            
            # Right Face
            svg_content.append(
                f'  <polygon points="{b_bottom[0]},{b_bottom[1]} {b_right[0]},{b_right[1]} {t_right[0]},{t_right[1]} {t_bottom[0]},{t_bottom[1]}" '
                f'fill="{color["right"]}" />'
            )
            
            # Top Face
            svg_content.append(
                f'  <polygon points="{t_top[0]},{t_top[1]} {t_left[0]},{t_left[1]} {t_bottom[0]},{t_bottom[1]} {t_right[0]},{t_right[1]}" '
                f'fill="{color["top"]}" />'
            )
            
            # Edges
            if level > 0:
                svg_content.append(
                    f'  <polyline points="{t_left[0]},{t_left[1]} {t_bottom[0]},{t_bottom[1]} {t_right[0]},{t_right[1]}" '
                    f'fill="none" stroke="{color["line"]}" stroke-width="1.2" opacity="0.8" />'
                )
                svg_content.append(
                    f'  <line x1="{t_bottom[0]}" y1="{t_bottom[1]}" x2="{b_bottom[0]}" y2="{b_bottom[1]}" '
                    f'stroke="{color["line"]}" stroke-width="1.5" opacity="0.8" />'
                )
            else:
                # Slight outline for the ground blocks
                svg_content.append(
                    f'  <polygon points="{t_top[0]},{t_top[1]} {t_left[0]},{t_left[1]} {t_bottom[0]},{t_bottom[1]} {t_right[0]},{t_right[1]}" '
                    f'fill="none" stroke="{color["line"]}" stroke-width="0.5" />'
                )

svg_content.append('</svg>')

os.makedirs('assets', exist_ok=True)
with open('assets/ps2_towers.svg', 'w') as f:
    f.write('\\n'.join(svg_content))

print("Successfully generated gorgeous PS2 towers SVG")
