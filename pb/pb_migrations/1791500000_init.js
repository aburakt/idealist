/// <reference path="../pb_data/types.d.ts" />

/**
 * İdealist Mühendislik içerik şeması. Türkçe site + tek sayfalık İngilizce özet (/en/). Standart: astro-pocketbase
 * (koleksiyon/alan adları İngilizce). Okuma: içerik published = true ile sınırlı; Site Ayarları herkese açık (tek kayıt).
 * Yazma: yalnız superuser (null). Panel müşterinin kendi başına düzenleyebileceği hâlde gelir: her alanda Türkçe yardım
 * metni, her koleksiyonda okunur alan (presentable), şema düğmeleri gizli. Korumalar pb_hooks/lib/protect.js'te.
 */
migrate((app) => {
  const SLUG = "^[a-z0-9]+(?:-[a-z0-9]+)*$"
  const SIRA = "Listede küçük sayı önce gelir. Araya eklemek için 10, 20, 30 gibi aralıklı sayılar kullanın."
  const PUB = "İşaretli değilse kayıt sitede görünmez (taslak). Yeni kayıtta işaretlemeyi unutmayın; siteden kaldırmak için silmek yerine işareti kaldırın."
  const IMG = "Telefon fotoğrafı ya da büyük render da yükleyebilirsiniz; site görseli web için kendisi küçültür."
  const IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"]

  const text = (name, help, extra) => Object.assign({ name, type: "text", help }, extra || {})
  const long = (name, help, extra) => text(name, help, Object.assign({ max: 20000 }, extra || {}))
  const url = (name, help, extra) => Object.assign({ name, type: "url", help }, extra || {})
  const editor = (name, help) => ({ name, type: "editor", convertURLs: false, maxSize: 2000000, help })
  const image = (name, help, extra) => Object.assign({ name, type: "file", maxSelect: 1, maxSize: 20 * 1024 * 1024, mimeTypes: IMAGE_MIME, thumbs: ["400x0", "1200x0"], help }, extra || {})
  const position = () => ({ name: "position", type: "number", onlyInt: true, help: SIRA })
  const published = (help) => ({ name: "published", type: "bool", help: help || PUB })
  const slug = (help) => ({ name: "slug", type: "text", pattern: SLUG, max: 120, help })
  const timestamps = () => [
    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ]
  const make = (name, fields, rules, indexes) => {
    const c = new Collection({
      type: "base", name,
      listRule: rules.list, viewRule: rules.view, createRule: rules.create, updateRule: rules.update, deleteRule: rules.delete,
      fields: [...fields, ...timestamps()], indexes: indexes || [],
    })
    app.save(c)
    return c
  }
  const PUBLISHED = { list: "published = true", view: "published = true", create: null, update: null, delete: null }
  const PUBLIC = { list: "", view: "", create: null, update: null, delete: null }

  // ---------- settings (Site Ayarları, tek kayıt) ----------
  make("settings", [
    text("company_name", "Firmanın kısa adı (ör. İdealist Mühendislik). Sayfa başlıklarında ve sayfa altında görünür.", { required: true, max: 120, presentable: true }),
    text("legal_name", "Şirketin ticari unvanı. Sayfa altında ve İletişim sayfasında görünür.", { max: 300 }),
    text("tagline", "Kısa slogan (ör. Kaliteli, modern ve güvenli projeler). Ana sayfa başlığının üstünde küçük yazı.", { max: 160 }),
    text("phone", "Santral telefonu (ör. +90 (312) 905 55 66). Menüdeki ara düğmesi, sayfa altı ve İletişim sayfasında görünür.", { required: true, max: 40 }),
    text("phone2", "İkinci santral numarası. Boşsa görünmez.", { max: 40 }),
    text("fax", "Faks numarası. Boşsa görünmez.", { max: 40 }),
    { name: "email", type: "email", required: true, help: "İletişim e-postası. Sayfa altı ve İletişim sayfasında görünür." },
    long("address", "Açık adres. Sayfa altı ve İletişim sayfasında görünür.", { required: true, max: 500 }),
    url("map_url", "Google Haritalar yerleştirme (embed) adresi: Haritalar > Paylaş > Harita yerleştir > src=\"…\" içindeki adres. Boşsa harita görünmez."),
    text("hero_title", "Ana sayfanın en üstündeki büyük başlık.", { required: true, max: 200 }),
    long("hero_text", "Büyük başlığın altındaki 1-2 cümlelik açıklama.", { max: 600 }),
    image("hero_image", "Ana sayfanın üstündeki büyük proje görseli (yatay). " + IMG),
    long("about_summary", "Ana sayfadaki \"Hakkımızda\" bölümünün metni. Tam metin Sayfalar > Hakkımızda kaydındadır.", { max: 3000 }),
    { name: "founded_year", type: "number", onlyInt: true, min: 1900, max: 2100, help: "Kuruluş yılı (ör. 2004). Ana sayfadaki rakamlarda \"… yılından beri\" olarak görünür." },
    text("footer_text", "Sayfa altında (footer) logonun altındaki kısa cümle. Boşsa görünmez.", { max: 300 }),
    text("seo_description", "Google'da ve link paylaşımlarında görünen genel site açıklaması (150-160 karakter). Kendi açıklaması olmayan bütün sayfalarda kullanılır.", { max: 300 }),
    image("share_image", "WhatsApp, LinkedIn gibi yerlerde site linki paylaşılınca görünen görsel. Yatay, 1200x630 piksel önerilir. Boşsa ana sayfa görseli kullanılır."),
  ], PUBLIC)

  // ---------- pages (sabit sayfalar) ----------
  const pages = make("pages", [
    text("title", "Sayfanın başlığı (sitede büyük başlık olarak görünür).", { required: true, max: 200, presentable: true }),
    editor("body", "Sayfanın metni. Ara başlık, liste ve kalın yazı kullanabilirsiniz; renk/yazı tipi değişiklikleri sitede uygulanmaz."),
    text("seo_description", "Google'da bu sayfa için görünen kısa açıklama (150-160 karakter). Boşsa Site Ayarları'ndaki genel açıklama kullanılır.", { max: 300 }),
    published("Bu sayfalar hep yayında kalmalıdır; işaret kaldırılamaz."),
    Object.assign(slug("Dokunmayın. Sayfanın adresi (hakkimizda = Hakkımızda, en = İngilizce sayfa); değiştirilemez."), { required: true }),
  ], PUBLISHED, ["CREATE UNIQUE INDEX idx_pages_slug ON pages (slug)"])
  for (const [s, t] of [["hakkimizda", "Hakkımızda"], ["en", "Idealist Engineering"]]) {
    const r = new Record(pages)
    r.set("slug", s)
    r.set("title", t)
    r.set("published", true)
    app.save(r)
  }

  // ---------- services (Hizmetler) ----------
  make("services", [
    text("title", "Hizmetin adı (ör. Proje Yönetimi).", { required: true, max: 120, presentable: true }),
    text("title_en", "Hizmetin İngilizce adı. İngilizce sayfada (/en/) görünür.", { max: 120 }),
    long("summary", "Hizmetin kısa açıklaması (1-2 cümle).", { max: 1000 }),
    { name: "icon", type: "select", values: ["mep", "structure", "design", "management"], maxSelect: 1, required: true, help: "Kartın simgesi: mep = mekanik/elektrik, structure = yapı, design = mimari tasarım, management = proje yönetimi." },
    position(), published(),
  ], PUBLISHED)

  // ---------- areas (Faaliyet alanları = proje kategorileri) ----------
  const areas = make("areas", [
    text("title", "Faaliyet alanının adı (ör. Konutlar). Projeler sayfasında kategori olarak görünür.", { required: true, max: 120, presentable: true }),
    text("title_en", "İngilizce adı. İngilizce sayfada (/en/) görünür.", { max: 120 }),
    { name: "icon", type: "select", values: ["mixed", "institution", "health", "hotel", "home", "office", "school", "mall", "social", "industry", "sport", "globe"], maxSelect: 1, required: true, help: "Simge: mixed = karma, institution = kurum, health = sağlık, hotel = otel, home = konut, office = ofis, school = eğitim, mall = AVM, social = sosyal, industry = sanayi, sport = spor, globe = yurt dışı." },
    slug("Kategori sayfasının adresi (idealistmuhendislik.com.tr/projeler/…). Boş bırakırsanız addan üretilir. Kaydettikten sonra değiştirilemez."),
    position(), published(),
  ], PUBLISHED, ["CREATE UNIQUE INDEX idx_areas_slug ON areas (slug)"])

  // ---------- projects (Projeler) ----------
  make("projects", [
    text("name", "Projenin adı (ör. Batman 500 Yataklı Devlet Hastanesi).", { required: true, max: 200, presentable: true }),
    { name: "areas", type: "relation", collectionId: areas.id, cascadeDelete: false, minSelect: 1, maxSelect: 12, required: true, help: "Projenin göründüğü faaliyet alanları (birden fazla seçilebilir, ör. Oteller + Yurt Dışı)." },
    text("usage", "Kullanım türü (ör. Konut, AVM, Ofis). Proje kartında ve sayfasında görünür. Boşsa görünmez.", { max: 200 }),
    text("client", "İşveren / yatırımcı (ör. Bayraktar İnşaat). Boşsa görünmez.", { max: 200 }),
    text("architect", "Mimari proje ofisi (ör. ZK Mimarlık). Boşsa görünmez.", { max: 200 }),
    { name: "year", type: "number", onlyInt: true, min: 1990, max: 2100, help: "Proje yılı (ör. 2021). Boşsa görünmez." },
    text("location", "Konum (ör. Çayyolu, Ankara). Boşsa görünmez.", { max: 200 }),
    { name: "area_m2", type: "number", onlyInt: true, min: 0, help: "Toplam inşaat alanı, m² (yalnız rakam, nokta koymadan: 150000). Sitede 150.000 m² olarak görünür. Boşsa görünmez." },
    long("summary", "İsteğe bağlı kısa proje açıklaması (kapsam, öne çıkan sistemler). Proje sayfasında görünür. Paragrafları Enter ile ayırın.", { max: 5000 }),
    { name: "images", type: "file", maxSelect: 40, maxSize: 20 * 1024 * 1024, mimeTypes: IMAGE_MIME, thumbs: ["400x0", "1200x0"], required: true, help: "Proje görselleri. İlk görsel kapak olur; sırayı sürükleyerek değiştirebilirsiniz. " + IMG },
    { name: "featured", type: "bool", help: "İşaretliyse proje ana sayfadaki \"Öne çıkan projeler\" bölümünde görünür (en fazla 6, sıra numarasına göre)." },
    slug("Proje sayfasının adresi (idealistmuhendislik.com.tr/projeler/…/). Boş bırakırsanız addan üretilir. Kaydettikten sonra değiştirilemez; paylaşılan linkler kırılmasın."),
    position(), published(),
  ], PUBLISHED, ["CREATE UNIQUE INDEX idx_projects_slug ON projects (slug)"])

  // ---------- panel ve sunucu ayarları ----------
  const s = app.settings()
  s.meta.appName = "İdealist Mühendislik Site Yönetimi"
  s.meta.hideControls = true
  s.logs.maxDays = 14
  s.backups.cron = "0 3 * * *"
  s.backups.cronMaxKeep = 7
  s.rateLimits.enabled = true
  s.rateLimits.rules = [
    { label: "*:auth", audience: "", duration: 3, maxRequests: 5 },
    { label: "/api/", audience: "", duration: 10, maxRequests: 300 },
    // build görselleri aynı anda çeker; dosya indirme için geniş sınır (`/api/files/` etiketi PB'de eşleşmiyor, jciankara'da ölçüldü)
    { label: "*:file", audience: "", duration: 10, maxRequests: 100000 },
  ]
  s.trustedProxy.headers = ["X-Forwarded-For"]
  s.trustedProxy.useLeftmostIP = false
  app.save(s)

  // kullanılmayan varsayılan users koleksiyonu (boşsa)
  try {
    const users = app.findCollectionByNameOrId("users")
    if (app.countRecords("users") === 0) app.delete(users)
  } catch (_) { /* zaten yok */ }
}, (app) => {
  for (const name of ["projects", "areas", "services", "pages", "settings"]) {
    try { app.delete(app.findCollectionByNameOrId(name)) } catch (_) {}
  }
})
