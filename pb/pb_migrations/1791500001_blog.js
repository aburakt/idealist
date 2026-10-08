/// <reference path="../pb_data/types.d.ts" />

/**
 * Blog (posts) ve WhatsApp düğmesi. Blog, mekanik tesisat konularında arama motorlarına içerik sağlar; yazılar
 * /blog/<slug>/ adresinde yayınlanır. WhatsApp bağlantısı boşsa sitede düğme görünmez.
 */
migrate((app) => {
  const SLUG = "^[a-z0-9]+(?:-[a-z0-9]+)*$"
  const PUB = "İşaretli değilse yazı sitede görünmez (taslak). Yeni yazıda işaretlemeyi unutmayın; siteden kaldırmak için silmek yerine işareti kaldırın."
  const IMG = "Telefon fotoğrafı ya da büyük render da yükleyebilirsiniz; site görseli web için kendisi küçültür."
  const IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"]

  const posts = new Collection({
    type: "base", name: "posts",
    listRule: "published = true", viewRule: "published = true", createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true, max: 300, presentable: true, help: "Yazının başlığı. Google'da ve blog listesinde görünür; 60-70 karakteri geçmemesi iyi olur." },
      { name: "date", type: "date", required: true, help: "Yayın tarihi. Blog listesi yeniden eskiye bu tarihe göre sıralanır." },
      { name: "category", type: "text", max: 60, help: "Konu (ör. Sağlık yapıları, Enerji verimliliği). Aynı konudaki yazılar blog sayfasında birlikte süzülür." },
      { name: "excerpt", type: "text", max: 1000, help: "Blog listesinde ve Google'da görünen kısa özet (1-2 cümle, en fazla 160 karakter önerilir)." },
      { name: "body", type: "editor", convertURLs: false, maxSize: 2000000, required: true, help: "Yazının metni. Ara başlıklar için \"Başlık 2\" kullanın. Görsel eklemek için önce \"images\" alanına yükleyin, sonra metin içinde görsel düğmesiyle seçin." },
      { name: "cover", type: "file", maxSelect: 1, maxSize: 20 * 1024 * 1024, mimeTypes: IMAGE_MIME, thumbs: ["400x0", "1200x0"], help: "Kapak görseli (yatay). Listede, yazının başında ve paylaşım önizlemesinde görünür. " + IMG },
      { name: "images", type: "file", maxSelect: 30, maxSize: 20 * 1024 * 1024, mimeTypes: IMAGE_MIME, thumbs: ["400x0"], help: "Metin içinde kullanılacak görseller. Burada tek başına görünmezler; metne eklenmeleri gerekir." },
      { name: "slug", type: "text", pattern: SLUG, max: 120, help: "Sayfa adresi (idealistmuhendislik.com.tr/blog/…). Boş bırakırsanız başlıktan üretilir. Kaydettikten sonra değiştirilemez; paylaşılan linkler kırılmasın." },
      { name: "published", type: "bool", help: PUB },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_posts_slug ON posts (slug)"],
  })
  app.save(posts)

  const settings = app.findCollectionByNameOrId("settings")
  settings.fields.add(new Field({
    name: "whatsapp_url", type: "url",
    help: "WhatsApp bağlantısı (ör. https://wa.me/905321234567). Sağ altta yalnız simgeden oluşan WhatsApp düğmesi çıkar. Boşsa düğme görünmez.",
  }))
  app.save(settings)
}, (app) => {
  const settings = app.findCollectionByNameOrId("settings")
  settings.fields.removeByName("whatsapp_url")
  app.save(settings)
  try { app.delete(app.findCollectionByNameOrId("posts")) } catch (_) {}
})
