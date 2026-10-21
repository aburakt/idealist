/// <reference path="../pb_data/types.d.ts" />

// ORTAK (core): template'ten gelir, sitede elle değiştirilmez (bun run core:sync).
//
// Marka (site.js BRAND, lib/brand.js):
// 1. Sistem e-postaları: yönetim paneli hesaplarının (_superusers) parola sıfırlama, tek kullanımlık şifre, e-posta
//    değişikliği, doğrulama ve yeni konumdan giriş e-postaları her açılışta lib/mail.js şablonlarına eşitlenir
//    (yalnız fark varsa kaydedilir). Şablonların sahibi core'dur: panelden yapılan değişiklik sonraki açılışta geri alınır.
// 2. Panel logosu: panel CSP'si dış adresten görsele izin vermez (img-src 'self'), bu yüzden BRAND.logo PB'nin kendi
//    adresinden verilir: GET /api/<ID>/brand/logo (sunucu bir kez indirir, önbellekte tutar). panel/brand.js kullanır.
// Uygulama düzeyinde kayıt (app.save) guard.js'in istek kurallarına takılmaz; müşteri hesabı da şablonları değiştiremez.
{
  const BRAND_SITE = require(`${__hooks}/site.js`)

  // JSVM'de onServe yok; onBootstrap her açılışta (serve ve CLI komutları) veritabanı hazır olunca çalışır.
  onBootstrap((e) => {
    e.next()
    try {
      if (require(`${__hooks}/lib/mail.js`).apply(e.app)) e.app.logger().info("E-posta şablonları markaya göre güncellendi")
    } catch (err) {
      require(`${__hooks}/lib/report.js`).error(e.app, "E-posta şablonları güncellenemedi", { error: String(err) })
    }
  })

  // Panel logosu (herkese açık; giriş ekranında da görünür). Yalnız site.js BRAND.logo'daki sabit adres indirilir.
  routerAdd("GET", `/api/${BRAND_SITE.ID}/brand/logo`, (e) => {
    const logo = require(`${__hooks}/lib/brand.js`).brand(e.app).logo
    if (!logo) throw new NotFoundError("Logo yok.")
    const key = `brand.logo:${logo}`
    let hit = e.app.store().get(key)
    if (!hit || hit.until < Date.now()) {
      hit = { type: "", body: null, until: Date.now() + 10 * 60 * 1000 } // hata: 10 dakika sonra yeniden denenir
      try {
        const res = $http.send({ url: logo, method: "GET", timeout: 10 })
        const type = String((res.headers["Content-Type"] || [""])[0] || "").split(";")[0].trim()
        // yalnız raster (SVG PB adresinden sunulursa betik taşıyabilir), en çok 512 KB
        if (res.statusCode === 200 && /^image\/(png|webp|jpeg|gif)$/.test(type) && res.body.length && res.body.length <= 512 * 1024) {
          hit = { type, body: res.body, until: Date.now() + 6 * 60 * 60 * 1000 }
        }
      } catch (err) {
        e.app.logger().warn("Panel logosu indirilemedi", "url", logo, "error", String(err))
      }
      e.app.store().set(key, hit)
    }
    if (!hit.body) throw new NotFoundError("Logo alınamadı.")
    e.response.header().set("Cache-Control", "public, max-age=3600")
    e.response.header().set("Content-Security-Policy", "default-src 'none'")
    return e.blob(200, hit.type, hit.body)
  })
}
