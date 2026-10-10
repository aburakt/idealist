/// <reference path="../pb_data/types.d.ts" />

// Yönetim panelini Türkçe gösterir. Panel (PocketBase 0.37+) açılışta /_/extensions.js dosyasını yükler; resmi kayıt yolu
// yalnız Go'da olduğu için isteği burada yakalayıp panel/tr.js'i site etiketleriyle (panel/labels.json) birlikte döndürürüz.
// Dosya bozulur ya da PB bu adresi değiştirirse panel İngilizce çalışmaya devam eder.
routerUse((e) => {
  if (e.request.method !== "GET" || e.request.url.path !== "/_/extensions.js") return e.next()
  const labels = toString($os.readFile(__hooks + "/panel/labels.json"))
  const js = toString($os.readFile(__hooks + "/panel/tr.js"))
  e.response.header().set("Content-Type", "text/javascript; charset=utf-8")
  e.response.header().set("Cache-Control", "no-cache")
  return e.string(200, "window.PB_TR_LABELS = " + labels + ";\n" + js)
})
