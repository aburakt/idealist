// SİTEYE ÖZEL: ortak hook'lar (core.pb.js, lib/protect.js) bu dosyayı okur.
// Yeni içerik koleksiyonu CONTENT'e eklenir; yoksa değişiklik siteye yansımaz (tests/core.test.ts ölçer).
const HINT = "metni değiştirin ya da yayın işaretini kaldırın."
module.exports = {
  ID: "idealist",
  CONTENT: ["settings", "pages", "services", "areas", "projects", "posts"],
  // Panel korumaları; alanların anlamı lib/protect.js başında.
  // - settings: tek kayıt; silinse site telefon/adres bilgisini kaybeder, build kırılır.
  // - pages: iki sabit sayfa (Hakkımızda, İngilizce sayfa); açılamaz, silinemez, gizlenemez, adresi kilitli.
  // - areas: faaliyet alanı silinemez (projeler ona bağlı); gizlemek için yayın işareti kaldırılır.
  // - projects, posts: adres boşsa ad/başlıktan üretilir, sonra kilitlenir.
  RULES: {
    settings: { label: "Site Ayarları", singleton: true, noDelete: true, deleteHint: HINT },
    pages: { label: "Sayfalar", noCreate: true, noDelete: true, deleteHint: HINT, locked: ["slug"], alwaysPublished: true },
    areas: { label: "Faaliyet alanları", noDelete: true, deleteHint: HINT, slugFrom: "title", locked: ["slug"] },
    projects: { slugFrom: "name", locked: ["slug"] },
    posts: { slugFrom: "title", locked: ["slug"] },
  },
}
