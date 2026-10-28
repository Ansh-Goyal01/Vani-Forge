# Generates public/hero/plate-5-3.png (Chladni figure, mode (5,3)). Run: python3 scripts/make-plate.py (needs numpy and Pillow).
import numpy as np
from PIL import Image, ImageFilter
rng = np.random.default_rng(5)
N = 1400
x, y = np.meshgrid(np.linspace(0, 1, N), np.linspace(0, 1, N))
n, m = 5, 3
f = np.cos(n*np.pi*x)*np.cos(m*np.pi*y) - np.cos(m*np.pi*x)*np.cos(n*np.pi*y)
# sand collects where the plate does not move (f ~ 0); heavier near the antinode-free centre
d = np.exp(-(np.abs(f)/0.085)**1.6)
cx = np.exp(-(((x-.5)**2+(y-.5)**2)/0.02))
density = np.clip(d*(0.55+0.9*cx), 0, 1)
noise = rng.random((N, N))
grain = (noise < density**1.15).astype(float)
soft = Image.fromarray((grain*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
g = np.asarray(soft).astype(float)/255
bright = 0.55 + 0.45*rng.random((N, N))
base = np.array([24, 24, 24], float)
sand = np.array([214, 211, 200], float)
img = base[None, None, :] + (sand-base)[None, None, :]*(g*bright)[:, :, None]
# faint horizontal scan banding like the deck
img *= (1 - 0.035*((np.arange(N) % 3 == 0)[:, None, None]))
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save("public/hero/plate-5-3.png", optimize=True)
