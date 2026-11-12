// OKNA — static site builder. No framework: reads content/*.json, writes dist/.
// Usage: node build.mjs   (env: BASE_PATH="/OKNA/", SITE_URL="https://user.github.io/OKNA", GITHUB_REPOSITORY="owner/repo")
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { icons, socialLabels } from './src/icons.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'dist');
const readJSON = async p => JSON.parse(await fs.readFile(path.join(ROOT, p), 'utf8'));

const settings = await readJSON('content/settings.json');
const home = await readJSON('content/home.json');

let BASE = process.env.BASE_PATH || '/';
if (!BASE.startsWith('/')) BASE = '/' + BASE;
if (!BASE.endsWith('/')) BASE += '/';
const SITE = (process.env.SITE_URL || settings.seo?.site_url || '').replace(/\/$/, '');
const REPO = process.env.GITHUB_REPOSITORY || 'spevyakin-web/okna';
const BRANCH = process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || 'main';

const ALL_LOCALES = [
  { code: 'ru', dir: 'ru', html: 'ru', name: 'Русский', short: 'RU' },
  { code: 'it', dir: 'it', html: 'it', name: 'Italiano', short: 'IT' },
  { code: 'en', dir: 'en', html: 'en', name: 'English', short: 'EN' },
  { code: 'uk', dir: 'uk', html: 'uk', name: 'Українська', short: 'UA' },
  { code: 'ro', dir: 'md', html: 'ro-MD', name: 'Moldovenească', short: 'MD' }
];
// The language chosen in the admin ("Настройки → Язык сайта") opens at "/"; the others live in their folders.
const DEFAULT_LANG = ALL_LOCALES.some(l => l.code === settings.site?.default_lang) ? settings.site.default_lang : 'ru';
const LOCALES = [
  ...ALL_LOCALES.filter(l => l.code === DEFAULT_LANG).map(l => ({ ...l, dir: '' })),
  ...ALL_LOCALES.filter(l => l.code !== DEFAULT_LANG)
];

const FONTS = {
  manrope: { body: 'manrope', head: 'manrope', fam: { manrope: 'Manrope Variable' } },
  inter: { body: 'inter', head: 'inter', fam: { inter: 'Inter Variable' } },
  montserrat: { body: 'montserrat', head: 'montserrat', fam: { montserrat: 'Montserrat Variable' } },
  playfair: { body: 'inter', head: 'playfair-display', fam: { inter: 'Inter Variable', 'playfair-display': 'Playfair Display Variable' } }
};
const CORNERS = { square: [2, 2, 2], soft: [14, 8, 10], round: [26, 14, 999] };

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const u = p => (!p ? '' : /^(https?:|mailto:|tel:|data:)/.test(p) ? p : BASE + String(p).replace(/^\//, ''));
const ic = n => icons[n] || icons.window;
const merge = (a, b) => {
  if (Array.isArray(a) || Array.isArray(b)) {
    const A = a || [], B = b || [];
    return (B.length ? B : A).map((x, i) => merge(A[i], x));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const o = { ...a };
    for (const k in b) o[k] = merge(a[k], b[k]);
    return o;
  }
  return b === undefined || b === null || b === '' ? a : b;
};
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const ytId = url => (String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];

// ---------- images ----------
const media = new Map(); // "/uploads/x.jpg" -> { src, srcset, w, h }
async function processLocalImages() {
  let sharp;
  try { sharp = (await import('sharp')).default; } catch { console.warn('sharp not available: local images copied as-is'); }
  const found = new Set();
  const walk = v => {
    if (typeof v === 'string' && /^\/uploads\/.+\.(jpe?g|png|webp|avif)$/i.test(v)) found.add(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(settings); walk(home);
  await fs.mkdir(path.join(OUT, 'img'), { recursive: true });
  for (const src of found) {
    const file = path.join(ROOT, 'public', src);
    if (!existsSync(file)) { console.warn('missing image', src); continue; }
    if (!sharp) continue;
    const img = sharp(file).rotate();
    const meta = await img.metadata();
    const W = meta.autoOrient?.width || meta.width, H = meta.autoOrient?.height || meta.height;
    const base = path.basename(src).replace(/\.[^.]+$/, '') + '-' + hash(src).slice(0, 6);
    const widths = [480, 960, 1600, 2200].filter(w => w < W);
    widths.push(Math.min(W, 2400));
    const set = [];
    for (const w of [...new Set(widths)]) {
      const name = `${base}-${w}.webp`;
      const dest = path.join(OUT, 'img', name);
      if (!existsSync(dest)) await sharp(file).rotate().resize({ width: w }).webp({ quality: 78 }).toFile(dest);
      set.push([w, 'img/' + name]);
    }
    const mid = set.find(([w]) => w >= 960) || set[set.length - 1];
    media.set(src, { src: u(mid[1]), srcset: set.map(([w, p]) => `${u(p)} ${w}w`).join(', '), w: W, h: H });
  }
}

function imgAttrs(src, { sizes = '100vw' } = {}) {
  if (!src) return null;
  if (media.has(src)) {
    const m = media.get(src);
    return { src: m.src, srcset: m.srcset, sizes, w: m.w, h: m.h };
  }
  if (/images\.unsplash\.com|plus\.unsplash\.com/.test(src)) {
    const b = src.split('?')[0];
    const q = w => `${b}?auto=format&fit=crop&w=${w}&q=70`;
    return { src: q(1200), srcset: [480, 800, 1200, 1600, 2000].map(w => `${q(w)} ${w}w`).join(', '), sizes };
  }
  return { src: u(src) };
}
function img(src, { alt = '', sizes, eager = false, lazySlide = false, cls = '' } = {}) {
  const a = imgAttrs(src, { sizes });
  if (!a) return '';
  const dim = a.w ? ` width="${a.w}" height="${a.h}"` : '';
  const c = cls ? ` class="${cls}"` : '';
  if (lazySlide) return `<img${c} data-src="${esc(a.src)}"${a.srcset ? ` data-srcset="${esc(a.srcset)}" sizes="${esc(a.sizes)}"` : ''} alt="${esc(alt)}"${dim}>`;
  return `<img${c} src="${esc(a.src)}"${a.srcset ? ` srcset="${esc(a.srcset)}" sizes="${esc(a.sizes)}"` : ''} alt="${esc(alt)}"${dim} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

// ---------- fonts ----------
async function buildFonts(key) {
  const conf = FONTS[key] || FONTS.manrope;
  let css = '';
  const preload = { latin: [], cyr: [] };
  for (const pkg of new Set([conf.body, conf.head])) {
    const dir = path.dirname(require.resolve(`@fontsource-variable/${pkg}/package.json`));
    const src = await fs.readFile(path.join(dir, 'index.css'), 'utf8');
    for (const block of src.match(/@font-face\s*{[^}]+}/g) || []) {
      const m = block.match(/files\/([\w.-]+\.woff2)/);
      if (!m || !/-(latin|latin-ext|cyrillic|cyrillic-ext)-wght-normal/.test(m[1])) continue;
      await fs.mkdir(path.join(OUT, 'fonts'), { recursive: true });
      await fs.copyFile(path.join(dir, 'files', m[1]), path.join(OUT, 'fonts', m[1]));
      css += block.replace(/url\(\.\/files\//g, `url(${BASE}fonts/`).replace(/\s+/g, ' ') + '\n';
      if (/-latin-wght/.test(m[1]) && pkg === conf.head) preload.latin.push(`${BASE}fonts/${m[1]}`);
      if (/-cyrillic-wght/.test(m[1]) && pkg === conf.head) preload.cyr.push(`${BASE}fonts/${m[1]}`);
    }
  }
  return { css, preload, body: conf.fam[conf.body], head: conf.fam[conf.head] };
}

// ---------- theme ----------
function lum(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function themeVars(t, fonts) {
  const dark = t.mode === 'dark';
  const [r, rs, rb] = CORNERS[t.corners] || CORNERS.soft;
  const accent = t.accent || '#F2B33D', primary = t.primary || '#1F5F8B';
  const onAccent = lum(accent) > 0.4 ? '#14202A' : '#FFFFFF';
  const v = {
    '--primary': primary,
    '--pt': dark ? `color-mix(in srgb, ${primary} 45%, #fff)` : primary,
    '--accent': accent,
    '--accent-d': `color-mix(in srgb, ${accent} 86%, #000)`,
    '--on-accent': onAccent,
    '--ink': dark ? '#E7EDF2' : t.ink || '#1D2A33',
    '--bg': dark ? '#0F1820' : '#FFFFFF',
    '--card': dark ? '#16222C' : '#FFFFFF',
    '--surface': dark ? '#131E27' : t.surface || '#EEF3F7',
    '--muted': dark ? '#9FB0BC' : `color-mix(in srgb, ${t.ink || '#1D2A33'} 70%, #fff)`,
    '--line': dark ? 'rgba(255,255,255,.11)' : `color-mix(in srgb, ${t.ink || '#1D2A33'} 13%, #fff)`,
    '--deep': `color-mix(in srgb, ${primary} 32%, #071017)`,
    '--bp': `color-mix(in srgb, ${primary} 88%, #000)`,
    '--frame': dark ? '#E9EDF0' : '#FFFFFF',
    '--frame-w': '14px',
    '--r': r + 'px', '--r-s': rs + 'px', '--r-btn': rb + 'px',
    '--ov': String((Number(t.overlay ?? 45) / 100).toFixed(2)),
    '--font': `"${fonts.body}", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
    '--font-h': `"${fonts.head}", ${fonts.head.includes('Playfair') ? 'Georgia, serif' : 'system-ui, sans-serif'}`
  };
  return ':root{' + Object.entries(v).map(([k, x]) => `${k}:${x}`).join(';') + '}h1,h2,h3{font-family:var(--font-h)}' + (fonts.head.includes('Playfair') ? 'h1,h2{font-weight:650;letter-spacing:-.015em}' : '');
}

// ---------- technology diagram ----------
function techSvg(parts) {
  const t = i => esc(parts[i]?.title || '');
  const mark = (n, x, y) => `<g class="mk"><circle cx="${x}" cy="${y}" r="13" fill="var(--accent)"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--on-accent)">${n}</text></g>`;
  return `<svg viewBox="0 0 520 470" role="img" aria-labelledby="techt">
<title id="techt">${t(0)}, ${t(1)}, ${t(2)}, ${t(3)}, ${t(4)}, ${t(5)}</title>
<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#9fb3c4" stroke-width="2"/></pattern></defs>
<g fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round">
  <!-- glass panes (triple) -->
  <rect x="222" y="18" width="7" height="236" fill="rgba(190,225,250,.35)"/>
  <rect x="262" y="18" width="7" height="236" fill="rgba(190,225,250,.35)"/>
  <rect x="302" y="18" width="7" height="236" fill="rgba(190,225,250,.35)"/>
  <rect x="229" y="18" width="33" height="236" fill="rgba(140,200,255,.12)" stroke="none"/>
  <rect x="269" y="18" width="33" height="236" fill="rgba(140,200,255,.12)" stroke="none"/>
  <line x1="301" y1="22" x2="301" y2="250" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/>
  <!-- warm-edge spacers -->
  <rect x="231" y="222" width="29" height="18" fill="rgba(255,255,255,.18)"/>
  <rect x="271" y="222" width="29" height="18" fill="rgba(255,255,255,.18)"/>
  <!-- sash -->
  <path d="M168 254 H222 V240 H206 V232 H192 V254 M309 240 H336 V254 M168 254 V352 H372 V254 H336" fill="rgba(255,255,255,.06)"/>
  <path d="M184 254 V336 H356 V262" stroke-opacity=".55"/>
  <path d="M232 262 V336 M282 262 V336 M318 262 V336" stroke-opacity=".55"/>
  <path d="M184 296 H356" stroke-opacity=".55"/>
  <!-- glazing bead -->
  <path d="M309 240 H336 V254 H309 Z" fill="rgba(255,255,255,.12)"/>
  <!-- steel in sash -->
  <path d="M244 276 V322 H306 V276" stroke="#cfd9e2" stroke-width="5" fill="url(#hatch)" fill-opacity=".5"/>
  <!-- frame -->
  <path d="M110 352 H420 V452 H110 Z" fill="rgba(255,255,255,.06)"/>
  <path d="M128 368 H402 V436 H128 Z" stroke-opacity=".55"/>
  <path d="M176 368 V436 M226 368 V436 M300 368 V436 M352 368 V436 M128 402 H176 M352 402 H402" stroke-opacity=".55"/>
  <!-- steel in frame -->
  <path d="M236 378 V426 H290 V378" stroke="#cfd9e2" stroke-width="5" fill="url(#hatch)" fill-opacity=".5"/>
  <!-- hardware channel -->
  <rect x="150" y="296" width="18" height="40" rx="3" fill="rgba(255,255,255,.25)"/>
  <path d="M159 300 V332" stroke="var(--accent)" stroke-width="3"/>
  <!-- seals -->
  <g fill="#0b1218" stroke="#0b1218"><rect x="174" y="346" width="14" height="10" rx="5"/><rect x="352" y="346" width="14" height="10" rx="5"/><rect x="214" y="236" width="10" height="16" rx="5"/><rect x="308" y="236" width="10" height="16" rx="5"/></g>
  <!-- outside / inside -->
  <text x="110" y="40" fill="#fff" stroke="none" font-size="13" opacity=".7">◂ out</text>
  <text x="380" y="40" fill="#fff" stroke="none" font-size="13" opacity=".7">in ▸</text>
  <!-- depth dimension -->
  <path d="M110 462 H420 M110 456 V468 M420 456 V468" stroke-opacity=".6" stroke-width="1"/>
</g>
${mark(1, 444, 402)}${mark(2, 263, 300)}${mark(3, 245, 120)}${mark(4, 330, 80)}${mark(5, 192, 236)}${mark(6, 132, 316)}
</svg>`;
}

// ---------- page sections ----------
function render(L, c) {
  const S = settings, B = S.business || {}, T = S.theme || {};
  const enabled = new Set((S.sections || []).filter(s => s.enabled).map(s => s.id));
  const tel = 'tel:' + String(B.phone || '').replace(/[^\d+]/g, '');
  const wa = String(B.whatsapp || '').replace(/\D/g, '');
  const waLink = wa ? `https://wa.me/${wa}` : '';
  const callBtn = (cls = 'btn btn-main') => `<a class="${cls}" href="${tel}">${icons.phone}<span>${esc(c.nav.call)}</span></a>`;
  const waBtn = (label, cls = 'btn btn-wa') => (waLink ? `<a class="${cls}" href="${waLink}" target="_blank" rel="noopener">${icons.whatsapp}<span>${esc(label)}</span></a>` : '');
  const head = (h, p) => `<div class="sec-head"><h2>${esc(h)}</h2>${p ? `<p>${esc(p)}</p>` : ''}</div>`;
  const id = (x) => `id="${x}"`;
  let tint = false;
  const sec = (key, inner, extra = '') => { tint = !tint; return `<section ${id(key)} class="sec${tint ? ' tint' : ''}${extra}"><div class="wrap">${inner}</div></section>`; };

  const R = {};
  R.services = () => sec('services', head(c.services.title, c.services.intro) + `<div class="svc">${(c.services.items || []).map(it => `
<article>${it.image ? `<div class="ph">${img(it.image, { alt: it.title, sizes: '(max-width:620px) 100vw, (max-width:980px) 50vw, 380px' })}</div>` : ''}
<div class="bd"><div class="ico">${ic(it.icon)}<h3>${esc(it.title)}</h3></div><p>${esc(it.text)}</p></div></article>`).join('')}</div>`);

  R.technology = () => {
    const tc = c.technology, h = tc.glazing_head || {};
    return sec('technology', head(tc.title, tc.intro) + `<div class="tech"><figure class="blueprint" style="margin:0">${techSvg(tc.parts || [])}</figure>
<ol class="parts">${(tc.parts || []).map((p, i) => `<li><span class="n">${i + 1}</span><div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div></li>`).join('')}</ol></div>
<div class="glz"><h3>${esc(tc.glazing_title)}</h3><div class="tbl" tabindex="0"><table><thead><tr><th>${esc(h.name)}</th><th>${esc(h.uw)}</th><th>${esc(h.sound)}</th><th>${esc(h.use)}</th></tr></thead><tbody>
${(tc.glazing || []).map(g => `<tr><td>${esc(g.name)}</td><td class="num">${esc(g.uw)}</td><td class="num">${esc(g.sound)}</td><td>${esc(g.use)}</td></tr>`).join('')}</tbody></table></div></div>`);
  };

  R.products = () => {
    const p = c.products;
    return sec('products', head(p.title) + `<div class="prod">${(p.items || []).map(it => `
<article class="${it.featured ? 'feat' : ''}">${it.featured ? `<span class="tag">${esc(p.badge)}</span>` : ''}
<h3>${esc(it.name)}</h3><div class="price">${esc(it.price)}</div>
<ul>${(it.features || []).map(f => `<li>${icons.check}<span>${esc(f.text)}</span></li>`).join('')}</ul>
<a class="btn ${it.featured ? 'btn-main' : 'btn-line'}" href="#contacts">${esc(p.cta)}</a></article>`).join('')}</div><p class="note">${esc(p.intro)}</p>`);
  };

  R.purchase = () => sec('purchase', head(c.purchase.title) + `<div class="buy">${(c.purchase.items || []).map(it => `
<article><div class="ico">${ic(it.icon)}</div><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></article>`).join('')}</div>`);

  R.process = () => sec('process', head(c.process.title) + `<ol class="steps">${(c.process.steps || []).map(s => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>`);

  R.install = () => sec('install', `<div class="split"><div class="ph">${img(c.install.image, { alt: c.install.title, sizes: '(max-width:860px) 100vw, 560px' })}</div>
<div class="txt"><h2>${esc(c.install.title)}</h2><p>${esc(c.install.text)}</p><ul class="ticks">${(c.install.points || []).map(p => `<li>${icons.check}<span>${esc(p.text)}</span></li>`).join('')}</ul></div></div>`);

  R.repair = () => {
    const r = c.repair;
    return sec('repair', `<div class="split rev"><div class="ph">${img(r.image, { alt: r.title, sizes: '(max-width:860px) 100vw, 560px' })}</div>
<div class="txt"><h2>${esc(r.title)}</h2><p>${esc(r.intro)}</p><div class="cbtns" style="margin-top:28px">${callBtn()}${waBtn('WhatsApp')}</div></div></div>
<div class="repair-grid"><div class="symptoms"><h3>${esc(r.symptoms_title)}</h3><ul>${(r.symptoms || []).map(s => `<li>${esc(s.text)}</li>`).join('')}</ul></div>
<div class="pricelist"><h3>${esc(r.prices_title)}</h3><dl>${(r.prices || []).map(p => `<div><dt>${esc(p.name)}</dt><dd>${esc(p.price)}</dd></div>`).join('')}</dl></div></div>`);
  };

  R.gallery = () => sec('gallery', head(c.gallery.title) + `<div class="gal">${(c.gallery.items || []).filter(g => g.image).map((g, i) => {
    const full = imgAttrs(g.image)?.src;
    return `<button type="button" data-full="${esc(full)}" data-cap="${esc(g.caption)}" aria-label="${esc(g.caption)}"><figure style="margin:0;height:100%">${img(g.image, { alt: g.caption, sizes: i === 0 ? '(max-width:760px) 100vw, 780px' : '(max-width:760px) 50vw, 380px' })}${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure></button>`;
  }).join('')}</div><dialog class="lb"><button type="button" aria-label="Close">${icons.close}</button><img alt=""><p></p></dialog>`);

  R.video = () => {
    const v = S.video || {};
    if (!v.url) return '';
    const yt = ytId(v.url);
    const poster = v.poster || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '');
    return sec('video', head(c.video.title, c.video.text) + `<div class="vid" data-kind="${yt ? 'yt' : 'file'}" data-src="${esc(yt || u(v.url))}">${poster ? img(poster, { alt: '', sizes: '(max-width:1180px) 100vw, 1180px' }) : ''}<button class="play" type="button" aria-label="${esc(c.video.play)}"><span>${icons.play}</span></button></div>`);
  };

  R.reviews = () => sec('reviews', head(c.reviews.title) + `<div class="rev">${(c.reviews.items || []).map(r => `
<blockquote><div class="stars" aria-label="${Number(r.rating || 5)}/5">${icons.star.repeat(Math.max(1, Math.min(5, Number(r.rating || 5))))}</div><p>${esc(r.text)}</p><footer><b>${esc(r.name)}</b>${esc(r.place)}</footer></blockquote>`).join('')}</div>`);

  R.faq = () => sec('faq', head(c.faq.title) + `<div class="faq">${(c.faq.items || []).map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`);

  R.contacts = () => {
    const k = c.contacts, f = k.form || {};
    const socials = (S.socials || []).filter(s => s.url).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener me" aria-label="${esc(socialLabels[s.network] || s.network)}">${icons[s.network] || icons.site}</a>`).join('');
    return `<section id="contacts" class="sec contact"><div class="wrap">${head(k.title, k.text)}<div class="cgrid"><div>
<a class="bigphone" href="${tel}">${icons.phone}${esc(B.phone)}</a>
<div class="cbtns">${waBtn('WhatsApp')}${B.telegram ? `<a class="btn btn-line" href="https://t.me/${esc(String(B.telegram).replace(/^@/, ''))}" target="_blank" rel="noopener">${icons.telegram}<span>Telegram</span></a>` : ''}${B.email ? `<a class="btn btn-line" href="mailto:${esc(B.email)}">${icons.mail}<span>${esc(B.email)}</span></a>` : ''}</div>
<ul class="cinfo"><li>${icons.clock}<div><small>${esc(k.hours_label)}</small>${esc(k.hours)}</div></li>${B.address ? `<li>${icons.pin}<div><small>${esc(k.address_label)}</small>${esc(B.address)}</div></li>` : ''}</ul>
${socials ? `<p class="follow">${esc(k.follow)}</p><div class="socials">${socials}</div>` : ''}</div>
<form class="form" novalidate data-key="${esc(S.form?.web3forms_key || '')}" data-wa="${S.form?.whatsapp_fallback !== false ? wa : ''}" data-mail="${esc(B.email || '')}" data-subject="${esc(B.brand)} — ${esc(f.title)}" data-ok="${esc(f.success)}" data-err="${esc(f.error)}" data-sending="${esc(f.sending)}">
<h3>${esc(f.title)}</h3>
<label>${esc(f.name)}<input name="name" autocomplete="name" required></label>
<label>${esc(f.phone)}<input name="phone" type="tel" autocomplete="tel" required></label>
<label>${esc(f.service)}<select name="service">${(f.services || []).map(s => `<option>${esc(s.text)}</option>`).join('')}</select></label>
<label>${esc(f.message)}<textarea name="message"></textarea></label>
<input class="hp" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">
<button class="btn btn-main" type="submit">${esc(f.submit)}</button><p class="msg" role="status" aria-live="polite"></p><small>${esc(f.privacy)}</small></form></div>
${B.map_query ? `<div class="map" data-q="${esc(B.map_query)}"><div><button class="btn btn-line" type="button" style="color:#fff">${icons.pin}<span>${esc(k.map_button)}</span></button><small>${esc(k.map_note)}</small></div></div>` : ''}
</div></section>`;
  };

  // nav
  const navKeys = ['services', 'technology', 'products', 'install', 'repair', 'gallery', 'reviews', 'faq', 'contacts'];
  const nav = navKeys.filter(k => enabled.has(k)).map(k => `<a href="#${k}">${esc(c.nav[k])}</a>`).join('');

  // hero
  const heroImgs = (T.hero_images || []).map(x => x.image).filter(Boolean);
  const heroVideo = T.hero_media === 'video' && T.hero_video;
  const heroSizes = T.hero_layout === 'full' ? '100vw' : '(max-width:900px) 92vw, 560px';
  let heroMedia;
  if (heroVideo) {
    const poster = heroImgs[0] ? imgAttrs(heroImgs[0], {}).src : '';
    heroMedia = `<video autoplay muted loop playsinline preload="metadata"${poster ? ` poster="${esc(poster)}"` : ''} src="${esc(u(T.hero_video))}"></video>`;
  } else {
    const list = T.hero_media === 'slideshow' ? heroImgs : heroImgs.slice(0, 1);
    heroMedia = list.map((s, i) => img(s, { alt: i === 0 ? c.hero.title : '', sizes: heroSizes, eager: i === 0, lazySlide: i > 0, cls: i === 0 ? 'on' : '' })).join('');
  }
  const copy = `<div class="copy"><h1>${esc(c.hero.title)}</h1><p class="lead">${esc(c.hero.subtitle)}</p>
<div class="ctas"><a class="btn btn-main" href="#contacts">${esc(c.hero.cta_primary)}</a>${waLink ? `<a class="btn ${T.hero_layout === 'full' ? 'btn-line' : 'btn-line'}" href="${waLink}" target="_blank" rel="noopener">${icons.whatsapp}<span>${esc(c.hero.cta_secondary)}</span></a>` : ''}</div>
<ul class="points">${(c.hero.points || []).map(p => `<li>${icons.check}${esc(p.text)}</li>`).join('')}</ul></div>`;
  let hero;
  if (T.hero_layout === 'full') {
    hero = `<section class="hero hero-full"><div class="bgmedia slides">${heroMedia}</div><div class="wrap">${copy}</div></section>`;
  } else if (T.hero_layout === 'split') {
    hero = `<section class="hero hero-split tint"><div class="wrap hero-grid">${copy}<div class="media-split slides">${heroMedia}</div></div></section>`;
  } else {
    hero = `<section class="hero tint"><div class="wrap hero-grid">${copy}<div class="frame-wrap">${c.hero.frame_width ? `<span class="dim dim-w" aria-hidden="true"><i>${esc(c.hero.frame_width)}</i></span>` : ''}${c.hero.frame_height ? `<span class="dim dim-h" aria-hidden="true"><i>${esc(c.hero.frame_height)}</i></span>` : ''}<div class="frame"><div class="slides">${heroMedia}</div><span class="mull-v"></span><span class="handle"></span></div><div class="sill"></div></div></div></section>`;
  }
  const stats = (c.stats || []).length ? `<div class="stats"><div class="wrap"><ul>${c.stats.map(s => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`).join('')}</ul></div></div>` : '';

  const body = (S.sections || []).filter(s => s.enabled && R[s.id]).map(s => R[s.id]()).join('\n');
  return { nav, hero, stats, body, callBtn, waBtn, tel, waLink };
}

// ---------- page shell ----------
function page(L, c, parts, ctx) {
  const S = settings, B = S.business || {};
  const url = l => `${SITE}${BASE}${l.dir ? l.dir + '/' : ''}`;
  const langs = LOCALES.map(l => `<li><a href="${BASE}${l.dir ? l.dir + '/' : ''}" hreflang="${l.html}" lang="${l.html}"${l.code === L.code ? ' aria-current="true"' : ''}>${esc(l.name)}</a></li>`).join('');
  const alt = SITE ? LOCALES.map(l => `<link rel="alternate" hreflang="${l.html}" href="${url(l)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${url(LOCALES[0])}"><link rel="canonical" href="${url(L)}">` : '';
  const og = S.seo?.og_image ? imgAttrs(S.seo.og_image)?.src : '';
  const ld = {
    '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', name: B.brand, founder: B.owner,
    telephone: B.phone, email: B.email || undefined, address: B.address || undefined, url: SITE ? url(L) : undefined,
    image: og || undefined, sameAs: (S.socials || []).map(s => s.url).filter(Boolean), areaServed: B.map_query || undefined
  };
  const csp = "default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://api.web3forms.com; frame-src https://www.youtube-nocookie.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com";
  const pre = (L.code === 'uk' || L.code === 'ru' ? ctx.fonts.preload.cyr : ctx.fonts.preload.latin).map(f => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`).join('');
  const brand = B.logo ? img(B.logo, { alt: B.brand, eager: true }) : `<span class="brand-mark" aria-hidden="true"></span>${esc(B.brand)}`;
  return `<!doctype html>
<html lang="${L.html}" data-mode="${settings.theme?.mode === 'dark' ? 'dark' : 'light'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(c.meta.title)}</title>
<meta name="description" content="${esc(c.meta.description)}">
<meta name="theme-color" content="${esc(settings.theme?.primary || '#1F5F8B')}">
${alt}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(c.meta.title)}"><meta property="og:description" content="${esc(c.meta.description)}">${og ? `<meta property="og:image" content="${esc(og)}">` : ''}<meta property="og:locale" content="${L.html.replace('-', '_')}">
<link rel="icon" href="${BASE}favicon.svg" type="image/svg+xml">
${pre}
<style>${ctx.fonts.css}${ctx.theme}${ctx.css}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<script src="${BASE}${ctx.js}" defer></script>
</head>
<body>
<a class="skip" href="#main">${esc(c.nav.services)}</a>
<header class="hdr"><div class="wrap">
<a class="brand" href="${BASE}${L.dir ? L.dir + '/' : ''}">${brand}</a>
<nav class="nav" aria-label="${esc(c.nav.menu)}">${parts.nav}</nav>
<details class="lang"><summary aria-label="${esc(c.nav.language)}">${icons.globe}${L.short}</summary><ul>${langs}</ul></details>
${parts.callBtn('btn btn-main btn-call')}
<button class="burger" type="button" aria-label="${esc(c.nav.menu)}" aria-expanded="false">${icons.menu}</button>
</div></header>
<main id="main">
${parts.hero}
${parts.stats}
${parts.body}
</main>
<footer class="ftr"><div class="wrap"><span>© ${new Date().getFullYear()} ${esc(B.brand)} — ${esc(B.owner)}. ${esc(c.footer.rights)}</span><span>${esc(c.footer.text)}${B.vat ? ' ' + esc(B.vat) : ''}</span></div></footer>
<div class="mbar">${parts.callBtn()}${parts.waLink ? parts.waBtn('WhatsApp') : ''}</div>
</body>
</html>`;
}

// ---------- admin ----------
async function buildAdmin() {
  const dest = path.join(OUT, 'admin');
  await fs.mkdir(path.join(dest, 'sveltia'), { recursive: true });
  const cmsDir = path.join(ROOT, 'node_modules/@sveltia/cms/dist');
  await fs.cp(cmsDir, path.join(dest, 'sveltia'), { recursive: true, filter: s => !s.endsWith('.map') });
  await fs.copyFile(path.join(ROOT, 'admin/index.html'), path.join(dest, 'index.html'));
  let yml = await fs.readFile(path.join(ROOT, 'admin/config.yml'), 'utf8');
  yml = yml.replaceAll('__REPO__', REPO).replaceAll('__BRANCH__', BRANCH);
  // site_url must be absolute; without a known address drop it (the CMS then uses the current origin)
  yml = SITE ? yml.replaceAll('__SITE__', SITE + BASE) : yml.split('\n').filter(l => !l.includes('__SITE__')).join('\n');
  await fs.writeFile(path.join(dest, 'config.yml'), yml);
}

// ---------- main ----------
await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });
if (existsSync(path.join(ROOT, 'public'))) await fs.cp(path.join(ROOT, 'public'), OUT, { recursive: true });
await processLocalImages();
const fonts = await buildFonts(settings.theme?.font);
const css = (await fs.readFile(path.join(ROOT, 'src/style.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s{2,}/g, ' ');
const jsSrc = await fs.readFile(path.join(ROOT, 'src/client.js'), 'utf8');
const js = `assets/app.${hash(jsSrc)}.js`;
await fs.mkdir(path.join(OUT, 'assets'), { recursive: true });
await fs.writeFile(path.join(OUT, js), jsSrc);
const ctx = { fonts, css, js, theme: themeVars(settings.theme || {}, fonts) };

for (const L of LOCALES) {
  // missing texts fall back to Russian (the owner's working language), then Italian
  const c = merge(merge(home.it, home.ru || {}), home[L.code] || {});
  const parts = render(L, c);
  const dir = path.join(OUT, L.dir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), page(L, c, parts, ctx));
}

// favicon (window mark)
const p = settings.theme?.primary || '#1F5F8B';
await fs.writeFile(path.join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="5" y="3" width="22" height="26" rx="2" fill="#fff" stroke="${p}" stroke-width="3"/><path d="M16 3v26M5 16h22" stroke="${p}" stroke-width="3"/></svg>`);
// 404 → Italian home
await fs.writeFile(path.join(OUT, '404.html'), `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${BASE}"><title>404</title><a href="${BASE}">Home</a>`);
await fs.writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nDisallow: ${BASE}admin/\n${SITE ? `Sitemap: ${SITE}${BASE}sitemap.xml\n` : ''}`);
if (SITE) {
  const loc = l => `${SITE}${BASE}${l.dir ? l.dir + '/' : ''}`;
  await fs.writeFile(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${LOCALES.map(l => `<url><loc>${loc(l)}</loc>${LOCALES.map(a => `<xhtml:link rel="alternate" hreflang="${a.html}" href="${loc(a)}"/>`).join('')}</url>`).join('')}</urlset>`);
}
await fs.writeFile(path.join(OUT, '.nojekyll'), '');
await buildAdmin();
console.log(`Default language: ${DEFAULT_LANG}. Built ${LOCALES.length} pages → dist/ (base ${BASE}, repo ${REPO})`);
