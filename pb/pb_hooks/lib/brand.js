/// <reference path="../../pb_data/types.d.ts" />

// ORTAK (core): template'ten gelir, sitede elle değiştirilmez (bun run core:sync).
//
// Sitenin markası: site.js BRAND (siteye özel) okunur, eksik değer güvenli varsayılanla tamamlanır.
//   name   görünen ad (yoksa Ayarlar > uygulama adı " Yönetimi" eki atılarak, o da yoksa site.js ID)
//   color  vurgu rengi (#rrggbb; sitenin CSS'indeki ana renk), ink / paper metin ve zemin rengi (isteğe bağlı)
//   url    sitenin herkese açık adresi (PUBLIC_SITE_URL ile aynı), logo e-posta logosunun https adresi (isteğe bağlı;
//          build site/public/logo.svg'den <url>/brand/logo-mail.png üretir). Logo yoksa ad yazıyla (wordmark) gösterilir.
// Kullananlar: lib/mail.js (e-posta şablonları), brand.pb.js (sistem e-postaları, panel vurgu rengi, panel logosu).
// Renk hesapları (kontrast, okunur renk) WCAG 2.x göreli parlaklığıyla yapılır.

const DEFAULTS = { color: "#2b3a4a", ink: "#1f2124", paper: "#f4f4f1" }
const WHITE = "#ffffff"
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
// PocketBase'in kurulumdaki uygulama adı: marka adı sayılmaz
const PB_DEFAULT_NAMES = ["Acme", "PocketBase"]

function hex6(value, fallback) {
  const v = String(value || "").trim()
  if (!HEX.test(v)) return fallback
  const h = v.slice(1).toLowerCase()
  return "#" + (h.length === 3 ? h.split("").map((c) => c + c).join("") : h)
}

function rgb(hex) {
  const h = hex6(hex, "#000000")
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
}

function toHex(c) {
  return "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")
}

/** WCAG göreli parlaklık (0 siyah, 1 beyaz). */
function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG kontrast oranı (1-21). */
function contrast(a, b) {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** a'dan b'ye t oranında karışım (0: a, 1: b). */
function mix(a, b, t) {
  const x = rgb(a)
  const y = rgb(b)
  return toHex(x.map((v, i) => v + (y[i] - v) * t))
}

/** Zemin üstünde daha okunur olan yazı rengi: beyaz ya da mürekkep. */
function onColor(bg, ink) {
  const dark = hex6(ink, DEFAULTS.ink)
  return contrast(WHITE, bg) >= contrast(dark, bg) ? WHITE : dark
}

/** fg, bg üstünde en az min kontrasta ulaşana kadar toward rengine yaklaştırılır (renk tonu korunur). */
function readable(fg, bg, min, toward) {
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const c = mix(fg, toward, t)
    if (contrast(c, bg) >= min) return c
  }
  return toward
}

/** Addan baş harfler (en çok iki): "İdealist Mühendislik" → "İM". Türkçe i/ı doğru büyür. */
function initials(name) {
  const up = (ch) => (ch === "i" ? "İ" : ch === "ı" ? "I" : ch.toUpperCase())
  const words = String(name || "").split(/[\s\-–·.,]+/).filter((w) => /^[^!-/:-@[-`{-~]/.test(w))
  return words.slice(0, 2).map((w) => up(Array.from(w)[0])).join("") || "•"
}

function siteModule() {
  try {
    return require(`${__hooks}/site.js`)
  } catch {
    return {}
  }
}

/**
 * Sitenin markası, eksikler tamamlanmış. raw verilmezse site.js BRAND okunur; app verilirse ad yoksa uygulama adından.
 * Dönen nesne: { name, color, ink, paper, url, logo }; renkler #rrggbb, url sonda / olmadan, logo yalnız https.
 */
function brand(app, raw) {
  const site = raw ? {} : siteModule()
  const b = raw || site.BRAND || {}
  let name = String(b.name || "").trim()
  if (!name && app) {
    try {
      const appName = String(app.settings().meta.appName || "").trim()
      if (!PB_DEFAULT_NAMES.includes(appName)) name = appName.replace(/\s+Yönetimi$/, "").trim()
    } catch {
      // ayarlar okunamadı: ID'ye düşülür
    }
  }
  if (!name) name = String(site.ID || "Site")
  const url = /^https?:\/\/[^\s"'<>]+$/.test(String(b.url || "")) ? String(b.url).replace(/\/+$/, "") : ""
  const logo = /^https:\/\/[^\s"'<>]+$/.test(String(b.logo || "")) ? String(b.logo) : ""
  return {
    name,
    color: hex6(b.color, DEFAULTS.color),
    ink: hex6(b.ink, DEFAULTS.ink),
    paper: hex6(b.paper, DEFAULTS.paper),
    url,
    logo,
  }
}

function escXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function svgUri(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

// SVG <img> içinde web fontu yüklenemez; sistem yazısının kalın harf genişliği tahmini (fazlası sağda boşluk kalır)
const FONT = "system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif"
const textWidth = (text, size) => Math.ceil(Array.from(text).length * size * 0.64)

/** Kare monogram (favicon ve wordmark rozeti): renkli zemin, okunur baş harfler. */
function monogramSvg(b, fill, fg) {
  const ini = escXml(initials(b.name))
  const size = Array.from(initials(b.name)).length > 1 ? 26 : 34
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">`
    + `<rect width="64" height="64" rx="14" fill="${fill}"/>`
    + `<text x="32" y="33" dominant-baseline="central" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${fg}">${ini}</text></svg>`
}

/** Rozet + ad (logo yokken panel logosu). light: koyu (vurgu renkli) zemin üstü için açık renkler. */
function wordmarkSvg(b, light) {
  const name = b.name.length > 40 ? b.name.slice(0, 39) + "…" : b.name
  const h = 40
  const fs = 20
  const w = 48 + textWidth(name, fs)
  const badgeFill = light ? WHITE : b.color
  const badgeFg = light ? b.color : onColor(b.color, b.ink)
  const text = light ? WHITE : readable(b.color, WHITE, 3, b.ink)
  const ini = escXml(initials(b.name))
  const isz = Array.from(initials(b.name)).length > 1 ? 15 : 19
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`
    + `<rect x="0" y="2" width="36" height="36" rx="9" fill="${badgeFill}"/>`
    + `<text x="18" y="21" dominant-baseline="central" text-anchor="middle" font-family="${FONT}" font-size="${isz}" font-weight="700" fill="${badgeFg}">${ini}</text>`
    + `<text x="48" y="21" dominant-baseline="central" font-family="${FONT}" font-size="${fs}" font-weight="700" fill="${text}">${escXml(name)}</text></svg>`
}

/**
 * Panelin (/_/extensions.js, panel/brand.js) marka verisi. Panel CSP'si (img-src 'self' data:) dış adresi engeller:
 * logo PB'nin kendi adresinden (logoPath, brand.pb.js) gelir; yüklenemezse rozet + ad (wordmark) kalır.
 * accent: panel vurgu rengi; panel bu zeminde beyaz yazı kullandığı için beyazla en az 4.5:1 olacak kadar koyulaştırılır.
 */
function panel(b, logoPath) {
  return {
    name: b.name,
    accent: readable(b.color, WHITE, 4.5, "#000000"),
    wordmark: svgUri(wordmarkSvg(b, false)),
    wordmarkLight: svgUri(wordmarkSvg(b, true)),
    favicon: svgUri(monogramSvg(b, b.color, onColor(b.color, b.ink))),
    logo: b.logo && logoPath ? logoPath : "",
  }
}

module.exports = { DEFAULTS, brand, hex6, luminance, contrast, mix, onColor, readable, initials, panel, wordmarkSvg, monogramSvg }
