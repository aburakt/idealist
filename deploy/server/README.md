# Sunucu ve yayın (178.105.148.70)

ebsbilgisayar/jciankara ile aynı düzen. Port 8098 önerilir (8095 expertup, 8096 jci, 8097 ebs; kurmadan önce `ss -ltnp | grep 809` ile boş olduğunu doğrulayın).

## 1. PocketBase (VPS)
1. `/opt/pb-idealist/` altına PB 0.40.4 binary'si (`PB_VERSION`), repodan `pb/pb_migrations/` ve `pb/pb_hooks/` (lib/ ve panel/ dahil).
2. `/opt/pb-idealist/.env` (root, 600): `CF_PAGES_DEPLOY_HOOK=…` (Cloudflare Pages deploy hook), `DEPLOY_QUIET_MS=45000`, `PB_ENCRYPTION_KEY=…`.
3. systemd `pb-idealist.service`: `pocketbase serve --http=127.0.0.1:8098 --dir /opt/pb-idealist/pb_data --migrationsDir … --hooksDir …` (pb-ebs unit'inin kopyası). İlk açılışta migration şemayı, iki sabit sayfayı, panel adını, yedek/rate limit ayarlarını kurar.
4. Superuser: `pocketbase superuser upsert <e-posta> <parola> --dir /opt/pb-idealist/pb_data`; parola `/root/.pb-secrets`.
5. Caddy: `cms.idealistmuhendislik.com.tr` → `127.0.0.1:8098`, jciankara-site `deploy/server/caddy-izin-listesi.py` ile aynı izin listesi (yalnız public okuma uçları; `/_/` SSH tüneliyle).
6. Yedek: `/etc/cron.d/pb-offsite` listesine `idealist` eklenir.

## 2. İçerik
SSH tüneli (`ssh -L 18098:127.0.0.1:8098 root@178.105.148.70`) üzerinden:
`PB_URL=http://127.0.0.1:18098 PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… bun scripts/seed-remote.ts`
Yalnız boş PB'ye çalışır (settings kaydı varsa durur). 73 proje ve 171 görsel yükler.

## 3. Cloudflare Pages
- Proje: repo `aburakt/idealist`, kök dizin `site`, build `bun run build`, çıktı `dist` (ebsbilgisayar ile aynı).
- Ortam: `PB_URL=https://cms.idealistmuhendislik.com.tr`, `PUBLIC_SITE_URL=https://www.idealistmuhendislik.com.tr`. PB hazır olana kadar `CONTENT_SOURCE=fixture` ile önizleme (noindex).
- Deploy hook oluşturulup VPS `.env`'ine yazılır. PB her kayıt değişikliğinde (45 sn sessizlikten sonra) yeniden yayınlatır.

## 4. DNS
- Alan adının bugünkü DNS'i ve e-posta sunucusu geçişten önce kontrol edilmeli; NS Cloudflare'e taşınacaksa MX/SPF/mail kayıtları birebir kopyalanır.
- `cms` A kaydı → 178.105.148.70.
- Geçişten sonra eski `index.html`, `projects.html`, `en.html` adresleri `_redirects` ile 301 verir.
