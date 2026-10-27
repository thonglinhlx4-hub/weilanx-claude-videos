# ep54 v2: portraits -> rembg cutout -> warm gold monochrome + feathered alpha + gold rim light -> public/ep54/fig-*.png
import sys, numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
SESS = {}
def proc(src, dst, crop=None, H=1000, cut=True, model='u2net_human_seg'):
    sess = SESS.setdefault(model, new_session(model))
    im = Image.open(src).convert('RGBA')
    if crop: im = im.crop(crop)
    im = im.resize((int(im.width * H / im.height), H), Image.LANCZOS)
    a = np.asarray(remove(im, session=sess))[..., 3].astype(np.float32) / 255 if cut else np.asarray(im)[..., 3] / 255.0
    rgb = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    L = (0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2])
    lo, hi = np.percentile(L[a > 0.5], [2, 99.5]); L = np.clip((L - lo) / (hi - lo + 1e-6), 0, 1) ** 0.85
    dark, mid, light = np.array([0.05, 0.03, 0.02]), np.array([0.78, 0.50, 0.22]), np.array([1.0, 0.93, 0.78])
    t = L[..., None]
    col = np.where(t < 0.55, dark + (mid - dark) * (t / 0.55), mid + (light - mid) * ((t - 0.55) / 0.45))
    # feather: erode a bit then blur; fade the bottom out
    A = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(9))
    A = np.asarray(A).astype(np.float32) / 255
    yy = np.linspace(0, 1, A.shape[0])[:, None]; A *= np.clip((0.97 - yy) / 0.22, 0, 1)
    # rim light: edge band of the alpha, stronger from upper-left
    edge = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
    band = np.clip(a - edge, 0, 1) * 2.2
    xx = np.linspace(0, 1, A.shape[1])[None, :]
    band *= np.clip(1.25 - 0.9 * xx - 0.4 * yy, 0.25, 1)
    col = col + band[..., None] * np.array([1.0, 0.78, 0.42]) * 1.2
    out = np.dstack([np.clip(col, 0, 1) * 255, np.clip(A, 0, 1) * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(dst); print(dst, out.shape)
P = '/workspace/work/weilanx-claude-videos/public/ep54/'
jobs = {
  'descartes': ('descartes.jpg', None), 'leibniz': ('leibniz.jpg', None), 'euler': ('euler.jpg', None),
  'dirichlet': ('dirichlet.jpg', (40, 30, 453, 545)), 'fermat': ('fermat.jpg', None, 'isnet-general-use'), 'bernoulli': ('bernoulli.jpg', None),
  'babylon': ('babylon.png', (300, 0, 1150, 768), 'isnet-general-use'),
}
for k in (sys.argv[1:] or list(jobs) + ['vendor']):
    if k == 'vendor':
        proc(P + 'chu-ban-rau.png', P + 'fig-vendor.png', None, cut=False); continue
    s, c, *m = jobs[k]; proc(s, P + f'fig-{k}.png', c, model=(m[0] if m else 'u2net_human_seg'))
