// SİTEYE ÖZEL: ortak hook'lar (core.pb.js, lib/protect.js) bu dosyayı okur.
// Yeni içerik koleksiyonu CONTENT'e eklenir; yoksa değişiklik siteye yansımaz (tests/core.test.ts ölçer).
const HINT = "metni değiştirin ya da yayın işaretini kaldırın."
module.exports = {
  ID: "idealist",
  CONTENT: ["settings", "pages", "services", "areas", "projects", "posts"],

  // Marka: sistem e-postalarının düzeni (lib/mail.js), form bildirimi ve panel logosu/rengi (lib/brand.js başında).
  // name: görünen ad. color: sitenin vurgu rengi, ink/paper: metin ve zemin (#rrggbb, CSS'teki renklerle aynı).
  // url: PUBLIC_SITE_URL. logo: site/public/logo.svg varsa build <url>/brand/logo-mail.png üretir, buraya o adres yazılır;
  // logo yoksa boş kalır, e-postada ve panelde ad yazıyla (marka renginde) görünür.
  BRAND: {
    name: "İdealist Mühendislik",
    color: "#e3000f",
    ink: "#1c1d1f",
    paper: "#ffffff",
    url: "https://www.idealistmuhendislik.com.tr",
    logo: "https://www.idealistmuhendislik.com.tr/brand/logo-mail.png",
    icon: "https://www.idealistmuhendislik.com.tr/brand/icon.png",
  },

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
