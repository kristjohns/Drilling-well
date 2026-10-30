"""Project Natural Earth country polygons around Norway to a local km grid for the 3D map.
Usage: python3 -I tools/map_data.py <ne_10m_admin_0_countries.geojson> <out.json>
Lambert conformal conic, standard parallels 58N/70N, centre 64N 10E. Output in km."""
import json, math, sys

src, out = sys.argv[1], sys.argv[2]
R = 6371.0
lat1, lat2, lat0, lon0 = map(math.radians, (58, 70, 64, 10))
n = math.log(math.cos(lat1) / math.cos(lat2)) / math.log(math.tan(math.pi / 4 + lat2 / 2) / math.tan(math.pi / 4 + lat1 / 2))
F = math.cos(lat1) * math.tan(math.pi / 4 + lat1 / 2) ** n / n
rho0 = R * F / math.tan(math.pi / 4 + lat0 / 2) ** n

def proj(lon, lat):
    lon, lat = math.radians(lon), math.radians(lat)
    rho = R * F / math.tan(math.pi / 4 + lat / 2) ** n
    th = n * (lon - lon0)
    return (rho * math.sin(th), rho0 - rho * math.cos(th))   # x east, y north (km)

def simplify(pts, tol):
    if len(pts) < 4:
        return pts
    def rdp(a, b):
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy) or 1e-9
        best, bi = -1, -1
        for i in range(a + 1, b):
            x0, y0 = pts[i]
            d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / L
            if d > best:
                best, bi = d, i
        if best > tol:
            return rdp(a, bi)[:-1] + rdp(bi, b)
        return [pts[a], pts[b]]
    sys.setrecursionlimit(100000)
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    # split the closed ring at the point farthest from the start, simplify both halves
    far = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    ring = pts + [pts[0]]
    pts = ring
    a = rdp(0, far)
    b = rdp(far, len(ring) - 1)
    return a[:-1] + b[:-1]

KEEP = {'Norway', 'Sweden', 'Finland', 'Denmark', 'United Kingdom', 'Russia', 'Faeroe Is.', 'Iceland', 'Ireland', 'Netherlands',
        'Germany', 'Belgium', 'France', 'Estonia', 'Latvia', 'Lithuania', 'Poland', 'Belarus'}
BOX = (-14, 47, 42, 79)  # lon/lat bounding box to keep
data = json.load(open(src))
countries = []
for f in data['features']:
    name = f['properties']['NAME']
    if name not in KEEP:
        continue
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    outp = []
    for poly in polys:
        ring = poly[0]
        lons = [p[0] for p in ring]; lats = [p[1] for p in ring]
        if max(lons) < BOX[0] or min(lons) > BOX[2] or max(lats) < BOX[1] or min(lats) > BOX[3]:
            continue
        # clip crudely: drop points far outside the box (Russia is huge)
        if name == 'Russia':
            ring = [p for p in ring if p[0] < 60 and p[1] > 55]
            if len(ring) < 4:
                continue
        pts = [proj(lon, lat) for lon, lat in ring]
        area = 0.5 * sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))
        if abs(area) < (25 if name == 'Norway' else 150):   # drop tiny islets (km^2)
            continue
        tol = 1.2 if name == 'Norway' else 3.0
        pts = simplify(pts, tol)
        if len(pts) < 4:
            continue
        outp.append([[round(x, 1), round(y, 1)] for x, y in pts])
    if outp:
        countries.append({'name': name, 'polys': outp})

FIELDS = {  # approximate field centres (lon, lat)
    'Johan Sverdrup': (2.60, 58.85), 'Troll': (3.72, 60.65), 'Snorre': (2.15, 61.45), 'Gullfaks': (2.27, 61.20),
    'Oseberg': (2.83, 60.50), 'Martin Linge': (1.90, 60.53), 'Yggdrasil': (2.15, 59.80), 'Ekofisk': (3.21, 56.55),
    'Johan Castberg': (20.33, 72.50), 'Snøhvit': (21.20, 71.60), 'Heidrun': (7.32, 65.33), 'Aasta Hansteen': (6.98, 67.07),
    'Valhall': (3.39, 56.28), 'Kollsnes': (4.83, 60.55),
}
CITIES = {'Stavanger': (5.73, 58.97), 'Bergen': (5.32, 60.39), 'Oslo': (10.75, 59.91), 'Trondheim': (10.40, 63.43),
          'Hammerfest': (23.68, 70.66), 'Tromsø': (18.96, 69.65), 'Kristiansund': (7.73, 63.11)}
res = {'countries': countries,
       'fields': {k: proj(*v) for k, v in FIELDS.items()},
       'cities': {k: proj(*v) for k, v in CITIES.items()},
       'seas': {'North Sea': proj(2.0, 58.9), 'Norwegian Sea': proj(3.0, 67.0), 'Barents Sea': (proj(30.0, 73.5))}}
json.dump(res, open(out, 'w'), separators=(',', ':'))
tot = sum(len(p) for c in countries for p in c['polys'])
print('countries', len(countries), 'points', tot, 'bytes', len(json.dumps(res)))
