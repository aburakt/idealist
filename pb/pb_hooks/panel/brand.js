// ORTAK (core): template'ten gelir, sitede elle değiştirilmez (bun run core:sync).
// Panelin markası: panel-tr.pb.js bunu /_/extensions.js içinde tr.js'in ardından, window.PB_BRAND verisiyle sunar
// (veri lib/brand.js panel(): name, accent, wordmark, wordmarkLight, favicon, logo).
// PocketBase 0.40 paneli logoyu ve sekme simgesini app.store'dan okur (mainLogo: giriş ekranı, headerLogo: üst çubuk,
// favicon). Logo varsa PB'nin kendi adresinden (/api/<ID>/brand/logo) yüklenir, yüklenemezse rozet + site adı kalır.
// Vurgu rengi panelin --accentColor değişkenine yazılır. PB'nin yapısı değişirse sessizce hiçbir şey yapmaz.
{
  const brand = window.PB_BRAND
  const store = window.app && window.app.store
  const set = (key, value) => {
    try {
      if (value && store && key in store && store[key] !== value) store[key] = value
    } catch {
      // panel yapısı değişti: PocketBase logosu kalır
    }
  }
  const css = (text) => {
    try {
      let el = document.getElementById("pb-brand-css")
      if (!el) {
        el = document.createElement("style")
        el.id = "pb-brand-css"
        document.head.appendChild(el)
      }
      el.textContent = text
    } catch {
      // stil eklenemedi
    }
  }

  if (brand && store) {
    set("mainLogo", brand.wordmark)
    set("headerLogo", brand.wordmarkLight)
    set("favicon", brand.favicon)
    // Vurgu rengi: PB ayarlardaki rengi satır içi yazar; markanınki öncelikli. Logo üst çubukta beyaz zemin üstünde.
    const accent = /^#[0-9a-f]{6}$/i.test(brand.accent || "") ? `:root{--accentColor:${brand.accent} !important}` : ""
    css(accent)
    if (brand.logo) {
      const img = new Image()
      img.onload = () => {
        set("mainLogo", brand.logo)
        set("headerLogo", brand.logo)
        css(accent + `.app-header .logo img{background:#fff;padding:3px 8px;border-radius:6px;box-sizing:content-box;max-height:22px}`)
      }
      img.src = brand.logo
    }
  }
}
