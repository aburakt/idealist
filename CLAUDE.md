# idealist

idealistmuhendislik.com.tr (İdealist Mühendislik, mekanik tesisat tasarım ve müşavirlik): Astro (static) + PocketBase. Standart: `astro-pocketbase` skill'i (ADR-002), ebsbilgisayar ve jciankara-site ile aynı iskelet. Türkçe site + tek sayfalık İngilizce özet (`/en/`).

## Komutlar (bun)
- `bun install` · `bun run check` (astro check) · `bun run build` · `bun test` · `bun run verify`
- `bun run verify`: kurallar testi + fixture build + PB build (gerçek içerik tohumlanır) + **PB/fixture paritesi** (aynı sayfalar, aynı metin) + sayfa/başlık/CSP kontrolleri
- `CONTENT_SOURCE=fixture bun run build`: PB olmadan, `site/src/data/content.json` ile önizleme build'i (noindex)
- `bun run verify:responsive`: her sayfa birçok genişlikte taşma kontrolü (yerel, Bun.WebView)
- `scripts/legacy/extract.py`: eski statik siteden içerik ve görsel çıkarıcı (elle düzeltilmiş proje tablosu); bir kez çalıştı, çıktısı commit'li
- `scripts/seed-remote.ts`: boş canlı PB'ye içeriği yükler (SSH tüneliyle)

## Kurallar
- Şema yalnızca `pb/pb_migrations/` ile; mevcut migration dosyası düzenlenmez, ek dosya eklenir.
- Her koleksiyonun beş API kuralı açıkça yazılır. Public okuma `published = true` ile sınırlı (settings hariç: tek kayıt, herkese açık).
- Her alanda Türkçe `help`, her koleksiyonda `presentable` alan (test ölçer). Panel korumaları `pb/pb_hooks/lib/protect.js`.
- Build'e superuser token'ı verilmez. PB yoksa build kırılır (yalnız `CONTENT_SOURCE=fixture` istisna).
- CSP `style-src 'self'`, `img-src 'self'`: hiçbir yerde `style=` ya da inline script yok; panel görselleri build'de indirilir.
- Tek sabit tema, koyu moda otomatik geçiş yok. Denge: üst bantlar ve footer koyu grafit (`.night` + `Flow` akış animasyonu), gövde taş tonu (`canvas`), kartlar beyaz. Sayfa sonlarına kırmızı "iletişime geçin" bandı konmaz (Burak'ın EBS geri bildirimi). Renkler logodan (kırmızı #e3000f, gri #9c9c9c).
- PB koleksiyonları: settings, pages (hakkimizda, en), services, areas (faaliyet alanları), projects, posts (blog, `site/src/data/posts.json` ile tohumlanır). Yeni koleksiyon `pb_hooks/idealist.pb.js` CONTENT listesine de eklenir.
- Proje adresi `/projeler/<slug>/`, faaliyet alanı adresi `/faaliyet-alanlari/<slug>/`, blog `/blog/<slug>/`; slug'lar kayıttan sonra kilitlidir.
- Logo: `site/public/logo.svg` eski PNG'den birebir vektör; yeniden çizilmez.
- Sırlar Infisical'da; repoda yalnızca `.env.example`. `_yedek/` repoya girmez.
- Eski adres yönlendirmeleri `site/public/_redirects` (test ölçer).
