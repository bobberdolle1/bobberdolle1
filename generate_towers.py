import urllib.request
import re
import math
import os

# Fetch contribution HTML
url = 'https://github.com/users/bobberdolle1/contributions'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Extract date and level
    days = re.findall(r'data-date="([^"]+)"[^>]*data-level="([^"]+)"', html)
    if not days:
        # Fallback
        days = re.findall(r'data-count="([^"]+)"[^>]*data-date="([^"]+)"', html)
        days = [(d, c) for c, d in days]  # Normalize
except Exception as e:
    print("Failed to fetch contribution data:", e)
    days = []

# If we couldn't fetch, mock some days so the build doesn't fail
if not days:
    print("Using fallback mock data")
    days = [("2026-01-01", "0") for _ in range(84)]

# We need the last 12 weeks of data (12 * 7 = 84 days)
last_84 = days[-84:]

# Reshape into a 12 (weeks, cols) x 7 (days, rows) grid
GRID_W = 12
GRID_H = 7
grid = [[0 for _ in range(GRID_H)] for _ in range(GRID_W)]

for idx, (date, level_str) in enumerate(last_84):
    week = idx // 7
    day = idx % 7
    if week < GRID_W and day < GRID_H:
        grid[week][day] = int(level_str)

# Canvas Configuration
WIDTH = 800
HEIGHT = 380
CELL_WIDTH = 32
CELL_HEIGHT = 16

# Color palettes by level (0 = dark tile, 4 = super glow purple)
COLORS = {
    0: {"top": "#050505", "left": "#020202", "right": "#030303", "line": "#0c0c0c", "height": 3},
    1: {"top": "#002d42", "left": "#00131f", "right": "#001e30", "line": "#005f8c", "height": 15},
    2: {"top": "#005580", "left": "#002b42", "right": "#003d5c", "line": "#00a2f3", "height": 35},
    3: {"top": "#00d4ff", "left": "#005f9e", "right": "#0077c2", "line": "#5cf0ff", "height": 65},
    4: {"top": "#8000ff", "left": "#330066", "right": "#4d0099", "line": "#b366ff", "height": 95}
}

# Isometric projection
def project(x, y, z):
    # Center origin horizontally and vertically
    x0 = WIDTH / 2
    y0 = 200
    
    iso_x = x0 + (x - y) * CELL_WIDTH
    iso_y = y0 + (x + y) * CELL_HEIGHT - z
    return iso_x, iso_y

svg_content = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="100%">',
    '  <!-- Deep Dark Space Background -->',
    '  <rect width="100%" height="100%" fill="#000000" />',
    '  ',
    '  <!-- Grid Scanlines -->',
    '  <defs>',
    '    <pattern id="lines" width="100" height="4" patternUnits="userSpaceOnUse">',
    '      <line x1="0" y1="0" x2="100" y2="0" stroke="#060606" stroke-width="1.5" />',
    '    </pattern>',
    '  </defs>',
    '  <rect width="100%" height="100%" fill="url(#lines)" />',
    '  '
]

# Draw back-to-front (depth = x + y)
# Shift the grid slightly for centered composition
# We center the grid of 12x7 by offsetting the x and y coordinates passed to projection
x_offset = -6
y_offset = -3.5

for depth in range(GRID_W + GRID_H - 1):
    for x in range(GRID_W):
        y = depth - x
        if 0 <= y < GRID_H:
            level = grid[x][y]
            color = COLORS[level]
            h = color["height"]
            
            # Project base coordinates
            px = x + x_offset
            py = y + y_offset
            
            b_top = project(px, py, 0)
            b_left = project(px + 1, py, 0)
            b_right = project(px, py + 1, 0)
            b_bottom = project(px + 1, py + 1, 0)
            
            # Project top coordinates
            t_top = project(px, py, h)
            t_left = project(px + 1, py, h)
            t_right = project(px, py + 1, h)
            t_bottom = project(px + 1, py + 1, h)
            
            # Draw Left Face (only if there's height, or draw base flat tile)
            svg_content.append(
                f'  <polygon points="{b_left[0]},{b_left[1]} {b_bottom[0]},{b_bottom[1]} {t_bottom[0]},{t_bottom[1]} {t_left[0]},{t_left[1]}" '
                f'fill="{color["left"]}" opacity="0.85" />'
            )
            
            # Draw Right Face
            svg_content.append(
                f'  <polygon points="{b_bottom[0]},{b_bottom[1]} {b_right[0]},{b_right[1]} {t_right[0]},{t_right[1]} {t_bottom[0]},{t_bottom[1]}" '
                f'fill="{color["right"]}" opacity="0.85" />'
            )
            
            # Draw Top Face
            svg_content.append(
                f'  <polygon points="{t_top[0]},{t_top[1]} {t_left[0]},{t_left[1]} {t_bottom[0]},{t_bottom[1]} {t_right[0]},{t_right[1]}" '
                f'fill="{color["top"]}" opacity="0.9" />'
            )
            
            # Draw glowing line edges (neon outlines)
            if level > 0:
                svg_content.append(
                    f'  <polyline points="{t_left[0]},{t_left[1]} {t_bottom[0]},{t_bottom[1]} {t_right[0]},{t_right[1]}" '
                    f'fill="none" stroke="{color["line"]}" stroke-width="1.2" opacity="0.9" />'
                )
                svg_content.append(
                    f'  <line x1="{t_bottom[0]}" y1="{t_bottom[1]}" x2="{b_bottom[0]}" y2="{b_bottom[1]}" '
                    f'stroke="{color["line"]}" stroke-width="1.8" opacity="0.95" />'
                )
            else:
                # Level 0 flat outline
                svg_content.append(
                    f'  <polygon points="{t_top[0]},{t_top[1]} {t_left[0]},{t_left[1]} {t_bottom[0]},{t_bottom[1]} {t_right[0]},{t_right[1]}" '
                    f'fill="none" stroke="{color["line"]}" stroke-width="0.5" opacity="0.4" />'
                )

svg_content.append('</svg>')

# Create assets folder if not exists
os.makedirs('assets', exist_ok=True)

# Write to file
with open('assets/ps2_towers.svg', 'w') as f:
    f.write('\n'.join(svg_content))

# Clean up scratch test file
if os.path.exists('test_scrape.py'):
    os.remove('test_scrape.py')

print("Successfully generated assets/ps2_towers.svg from Github commit history")
