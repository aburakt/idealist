// SİTEYE ÖZEL: ortak betikler (scripts/verify.ts, tests/hooks.test.ts) bu dosyayı okur.
// PB tarafındaki karşılığı pb/pb_hooks/site.js (ID, içerik koleksiyonları, panel korumaları).
import type { SiteConfig } from "./scripts/site-types"

export const SITE: SiteConfig = {
  checks: [
    { name: "Ana sayfa", path: "/", has: ['<html lang="tr"', "<h1", 'rel="canonical" href="https://www.idealistmuhendislik.com.tr/"', "Mekanik tesisat", "/logo.svg", "tel:+903129055566", "Seçili projeler", "Merkez Ankara", "/faaliyet-alanlari/saglik/", 'hreflang="en"'] },
    { name: "Hakkımızda", path: "/hakkimizda/", has: ["Kuruluş", "Misyon", "Mikail Sandıkcı", "2004"] },
    { name: "Projeler", path: "/projeler/", has: ["Ceylanpınar 75 Yataklı Devlet Hastanesi", "Malta City Center", "Tiflis Rehabilitasyon Merkezi", "/projeler/kervansaray/"] },
    { name: "Faaliyet alanı", path: "/faaliyet-alanlari/yurt-disi/", has: ["Yurt Dışı Projeleri", "Malta City Center", "Sheraton Batum Oteli"], hasNot: ["Merkez Ankara"] },
    { name: "Proje sayfası: bilgiler ve galeri", path: "/projeler/merkez-ankara/", has: ["Pasifik Çiftay İş Ortaklığı", "1.333.255 m²", "data-gallery-item", "data-viewer", "/_astro/"] },
    { name: "Proje sayfası: çok görselli", path: "/projeler/ceylanpinar-devlet-hastanesi/", has: ["görsel 19"] },
    { name: "İletişim", path: "/iletisim/", has: ["info@idealistmuhendislik.com.tr", "905 55 77", "284 08 09", "Kızılırmak", "google.com/maps/embed"] },
    { name: "İngilizce sayfa", path: "/en/", has: ['<html lang="en"', "Idealist Engineering", "Establishment", "Mechanical and Electrical Engineering", "International Projects"] },
    { name: "Blog", path: "/blog/", has: ["Mekanik tesisat üzerine yazılar", "/blog/hastanelerde-hvac-tasarimi/", "8 Ekim 2026"] },
    { name: "Blog yazısı", path: "/blog/sprinkler-yangin-sondurme-sistemleri/", has: ["TS EN 12845", "BlogPosting", "Diğer yazılar", "/_astro/"] },
    { name: "Yönlendirmeler build çıktısında", path: "/_redirects", has: ["/projects.html /projeler/ 301", "/en.html /en/ 301"] },
    { name: "404 sayfası", path: "/yok-boyle-bir-sayfa/", status: 404, has: ["Sayfa bulunamadı"] },
    { name: "Sitemap", path: "/sitemap-index.xml" },
    { name: "Robots", path: "/robots.txt", has: ["Sitemap:"] },
  ],
  hookSample: {
    // hizmet: zorunlu alanı yalnız title + icon
    collection: "services",
    create: { title: "hook-testi", icon: "mep", published: true },
    update: (n) => ({ summary: `özet ${n}` }),
  },
}
