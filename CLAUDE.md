# idealist

idealistmuhendislik.com.tr (İdealist Mühendislik, mekanik tesisat tasarım ve müşavirlik): Astro (static) + PocketBase. Standart: `astro-pocketbase` skill'i (ADR-002), ebsbilgisayar ve jciankara-site ile aynı iskelet. Türkçe site + tek sayfalık İngilizce özet (`/en/`).

## Komutlar (bun)
- `bun install` · `bun run check` (astro check) · `bun run build` · `bun test` · `bun run verify` · `bun run core:sync [etiket]`
- `bun run verify`: kurallar testi + fixture build + PB build (gerçek içerik tohumlanır) + **PB/fixture paritesi** (aynı sayfalar, aynı metin) + sayfa/başlık/CSP kontrolleri
- `CONTENT_SOURCE=fixture bun run build`: PB olmadan, `site/src/data/content.json` ile önizleme build'i (noindex)
- `bun run verify:responsive`: her sayfa birçok genişlikte taşma kontrolü (Bun.WebView; yerelde ve CI'da)
- `scripts/legacy/extract.py`: eski statik siteden içerik ve görsel çıkarıcı (elle düzeltilmiş proje tablosu); bir kez çalıştı, çıktısı commit'li
- `scripts/seed-remote.ts`: boş canlı PB'ye içeriği yükler (SSH tüneliyle)

## Core
- Ortak dosyalar `aburakt/astro-pb-template`'ten gelir (`core.json` listesi, `core.lock` sürümü); sitede elle değiştirilmez, `bun run core:sync [etiket]` ile güncellenir (`tests/core.test.ts` ölçer). Değişiklik template'te yapılır.
- Template core'u değişince `.github/workflows/core-sync.yml` (core) haftalık `core-sync` dalından PR açar; repo sırrı `CORE_SYNC_TOKEN` gerekir. Sunucuya dağıtım elle yapılır.
- Müşteri kısıtlı superuser'dır (`pb_hooks/lib/guard.js`, core): `PB_AGENCY_EMAILS`'te (sunucu `.env`) olmayan superuser yalnız içerik kayıtlarını ve kendi şifresini düzenler; şema, ayar, yedek ve hesap yönetimi ajansa açık.
- Siteye özel ayarlar: `pb/pb_hooks/site.js` (ID, CONTENT, panel korumaları RULES), `site.config.ts` (verify sayfa kontrolleri, hook testi kaydı), `pb/pb_hooks/panel/labels.json`.
- GEO/WebMCP (core: llms.txt, llms-full.txt, robots.txt, sayfaların `index.md` eşi, `/webmcp.json`): siteye ait tanım `site/src/lib/geo.ts` (bölümler Hakkımızda, Hizmetler, Faaliyet Alanları, Projeler, Blog, `/en/`; WhatsApp `kind: "whatsapp"`). robots.txt core üretir; `public/robots.txt` yok.
- Marka (core): mail şablonları ve panel logosu `site.js` `BRAND`'den; `site/public/logo.svg` varsa build `/brand/logo-mail.png` üretir.
- Türkçe büyük/küçük harf `site/src/lib/tr.ts` (core): `toLowerCase`/`toUpperCase` yerine `lower`/`upper`.

## Kurallar
- Şema yalnızca `pb/pb_migrations/` ile; mevcut migration dosyası düzenlenmez, ek dosya eklenir.
- Her koleksiyonun beş API kuralı açıkça yazılır. Public okuma `published = true` ile sınırlı (settings hariç: tek kayıt, herkese açık).
- Her alanda Türkçe `help`, her koleksiyonda `presentable` alan (test ölçer). Panel korumaları `pb/pb_hooks/lib/protect.js`.
- Panel Türkçedir: `pb/pb_hooks/panel-tr.pb.js`, panelin yüklediği `/_/extensions.js` isteğine `panel/tr.js` (sözlük) ve `panel/labels.json` (koleksiyon/alan etiketleri) ile cevap verir. Yeni koleksiyon ya da alan eklenince `labels.json` içine Türkçe etiketi yazılır (test ölçer). `tr.js` bütün sitelerde aynıdır; sitede elle değiştirilmez.
- Build'e superuser token'ı verilmez. PB yoksa build kırılır (yalnız `CONTENT_SOURCE=fixture` istisna).
- CSP `style-src 'self'`, `img-src 'self'`: hiçbir yerde `style=` ya da inline script yok; panel görselleri build'de indirilir.
- Tasarım dili kurumsal mühendislik müşavirliği (Arup, Max Fordham, Atelier Ten örnek alındı; araştırma `docs/tasarim-arastirma.md`): beyaz/kâğıt zemin, mürekkep siyahı metin, renk fotoğraflardan gelir, kırmızı (#e3000f) yalnız küçük vurgularda. Yazı IBM Plex Sans, sayı ve künye IBM Plex Mono. Parçacık/akış animasyonu, cam efektli buton, sayaç, slider, kırmızı CTA bandı yok. Tek sabit tema, koyu moda otomatik geçiş yok.
- PB koleksiyonları: settings, pages (hakkimizda, en), services, areas (faaliyet alanları), projects, posts (blog, `site/src/data/posts.json` ile tohumlanır). Yeni koleksiyon `pb/pb_hooks/site.js` CONTENT listesine de eklenir.
- Proje adresi `/projeler/<slug>/`, faaliyet alanı adresi `/faaliyet-alanlari/<slug>/`, blog `/blog/<slug>/`; slug'lar kayıttan sonra kilitlidir.
- Logo: `site/public/logo.svg` ve koyu zemin varyantı `logo-light.svg` (gri → beyaz) `scripts/legacy/logo.py` ile üretilir: eski PNG'den ölçülmüş temiz geometri. Şekil değiştirilmez, elle düzenlenmez; `<Logo tone="light">` koyu zeminde.
- Sırlar Infisical'da; repoda yalnızca `.env.example`. `_yedek/` repoya girmez.
- Başlık sırası verify'da ölçülür: sayfa h1'inin hemen altındaki kart listesi `level={2}` (ProjectCard, PostCard), bir h2 bölümünün içindeki kartlar h3; "diğer projeler/yazılar" etiketi h2.
- Dikey proje görselleri kaynakta en çok 1600×2000 px (`scripts/legacy/extract.py` MAX_W/MAX_H), görsel bütçesi 400 KB.
- Eski adres yönlendirmeleri `site/public/_redirects` (test ölçer).
