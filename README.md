# İdealist Mühendislik web sitesi

[idealistmuhendislik.com.tr](https://www.idealistmuhendislik.com.tr) için Astro (statik) + PocketBase. İçerik panelden (`cms.idealistmuhendislik.com.tr`) düzenlenir; her kayıt değişikliğinden sonra PocketBase Cloudflare Pages'e yeniden yayın komutu gönderir.

- Geliştirme: `bun install` sonra `CONTENT_SOURCE=fixture bun run --filter '@idealist/site' dev`
- Kontrol: `bunx oxlint && bun run check && bun run verify`
- Sunucu ve yayın: [deploy/server/README.md](deploy/server/README.md)
- Panel rehberi (müşteri için): [docs/panel-rehberi.md](docs/panel-rehberi.md)
