import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { startPb } from "./pb-harness"
import { seed } from "./seed"

const ROOT = join(import.meta.dir, "..")
const DIST = join(ROOT, "site", "dist")
const out = (line: string) => process.stdout.write(`${line}\n`)
const report = (ok: boolean, name: string, why = "") => {
  out(ok ? `✅ ${name}` : `❌ ${name}: ${why}`)
  return ok
}
const build = (env: Record<string, string>) =>
  Bun.spawnSync(["bun", "run", "build"], { cwd: ROOT, env: { ...process.env, PB_URL: "", CONTENT_SOURCE: "", ...env }, stdout: "ignore", stderr: "inherit" })

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}
const htmlOf = (dir: string) => Object.fromEntries(walk(dir).filter((f) => f.endsWith(".html")).map((f) => [f.slice(dir.length), readFileSync(f, "utf8")]))
/** Görünen metin: etiketler, betikler, önizleme bandı ve boşluk farkları atılır. */
const visible = (html: string): string =>
  html.replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, "").replace(/<p data-fixture-banner[\s\S]*?<\/p>/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim()

type Check = { name: string; path: string; status?: number; has?: string[]; hasNot?: string[] }
export const CHECKS: Check[] = [
  { name: "Ana sayfa", path: "/", has: ['<html lang="tr"', "<h1", 'rel="canonical" href="https://www.idealistmuhendislik.com.tr/"', "Mekanik tesisat", "/logo.svg", "tel:+903129055566", "Öne çıkan projeler", "Merkez Ankara", "/faaliyet-alanlari/saglik/", 'hreflang="en"'] },
  { name: "Hakkımızda", path: "/hakkimizda/", has: ["Kuruluş", "Misyon", "Mikail Sandıkcı", "2004"] },
  { name: "Projeler", path: "/projeler/", has: ["Ceylanpınar 75 Yataklı Devlet Hastanesi", "Malta City Center", "Tiflis Rehabilitasyon Merkezi", "/projeler/kervansaray/"] },
  { name: "Faaliyet alanı", path: "/faaliyet-alanlari/yurt-disi/", has: ["Yurt Dışı Projeleri", "Malta City Center", "Sheraton Batum Oteli"], hasNot: ["Merkez Ankara"] },
  { name: "Proje sayfası: bilgiler ve galeri", path: "/projeler/merkez-ankara/", has: ["Pasifik Çiftay İş Ortaklığı", "1.333.255 m²", "data-gallery-item", "data-viewer", "/_astro/"] },
  { name: "Proje sayfası: çok görselli", path: "/projeler/ceylanpinar-devlet-hastanesi/", has: ["görsel 19"] },
  { name: "İletişim", path: "/iletisim/", has: ["info@idealistmuhendislik.com.tr", "905 55 77", "284 08 09", "Kızılırmak", "google.com/maps/embed"] },
  { name: "İngilizce sayfa", path: "/en/", has: ['<html lang="en"', "Idealist Engineering", "Establishment", "Mechanical and Electrical Engineering", "International Projects"] },
  { name: "Blog", path: "/blog/", has: ["Mekanik tesisat üzerine yazılar", "/blog/hastanelerde-hvac-tasarimi/", "8 Ekim 2026"] },
  { name: "Blog yazısı", path: "/blog/sprinkler-yangin-sondurme-sistemleri/", has: ["TS EN 12845", "BlogPosting", "Diğer yazılar", "/_astro/"] },
  { name: "404 sayfası", path: "/yok-boyle-bir-sayfa/", status: 404, has: ["Sayfa bulunamadı"] },
  { name: "Sitemap", path: "/sitemap-index.xml" },
  { name: "Robots", path: "/robots.txt", has: ["Sitemap:"] },
]

async function runChecks(base: string): Promise<boolean> {
  let all = true
  for (const c of CHECKS) {
    const res = await fetch(base + c.path)
    const body = await res.text()
    const want = c.status ?? 200
    let why = ""
    if (res.status !== want) why = `${res.status} döndü, ${want} bekleniyordu`
    for (const s of c.has ?? []) if (!why && !body.includes(s)) why = `içerikte "${s}" yok`
    for (const s of c.hasNot ?? []) if (!why && body.includes(s)) why = `içerikte olmaması gereken "${s}" var`
    all = report(!why, c.name, why) && all
  }
  return all
}

function distChecks(): boolean {
  let all = true
  const headers = existsSync(join(DIST, "_headers")) ? readFileSync(join(DIST, "_headers"), "utf8") : ""
  const missing = ["frame-ancestors 'none'", "Strict-Transport-Security"].filter((s) => !headers.includes(s))
  all = report(missing.length === 0, "Güvenlik başlıkları", `_headers'ta eksik: ${missing.join(", ")}`) && all
  const inline: string[] = []
  const pages = walk(DIST).filter((p) => p.endsWith(".html"))
  for (const f of pages) {
    for (const m of readFileSync(f, "utf8").matchAll(/<script\b([^>]*)>/g)) if (!/\bsrc=/.test(m[1]) && !/type="application\/ld\+json"/.test(m[1])) inline.push(f.replace(DIST, ""))
  }
  all = report(inline.length === 0, "Inline script yok", [...new Set(inline)].join(", ")) && all
  const styled = pages.filter((f) => /<style[\s>]|\sstyle="/.test(readFileSync(f, "utf8")))
  all = report(styled.length === 0, "Inline stil yok (CSP style-src 'self')", styled.map((f) => f.replace(DIST, "")).join(", ")) && all
  const redirects = existsSync(join(DIST, "_redirects")) ? readFileSync(join(DIST, "_redirects"), "utf8") : ""
  all = report(redirects.includes("/projects.html /projeler/ 301") && redirects.includes("/en.html /en/ 301"), "Yönlendirmeler build çıktısında", "_redirects eksik ya da boş") && all
  // CSP img-src 'self': panel görselleri build'de indirilmiş olmalı, sayfada PB adresi kalmamalı
  const leaked = pages.filter((f) => /<img[^>]+src="https?:\/\//.test(readFileSync(f, "utf8"))).map((f) => f.replace(DIST, ""))
  return report(leaked.length === 0, "Görseller siteden servis edilir (dış adres yok)", leaked.slice(0, 4).join(", ")) && all
}

function serve() {
  return Bun.serve({
    hostname: "127.0.0.1", port: 0,
    async fetch(req) {
      let p = decodeURIComponent(new URL(req.url).pathname)
      if (p.endsWith("/")) p += "index.html"
      const f = Bun.file(join(DIST, p))
      if (await f.exists()) return new Response(f)
      const nf = Bun.file(join(DIST, "404.html"))
      return new Response((await nf.exists()) ? nf : "not found", { status: 404 })
    },
  })
}

async function main(): Promise<number> {
  const external = process.env.BASE_URL
  if (external) return (await runChecks(external.replace(/\/$/, ""))) ? 0 : 1

  out("— API kuralları (bun test)")
  const rules = Bun.spawnSync(["bun", "test", "tests/rules.test.ts"], { cwd: ROOT, stdout: "inherit", stderr: "inherit" })
  if (!report(rules.exitCode === 0, "API kuralları", "tests/rules.test.ts kırmızı")) return 1

  out("— Fixture build (referans)")
  if (!report(build({ CONTENT_SOURCE: "fixture" }).exitCode === 0, "Fixture build", "çıkış kodu ≠ 0")) return 1
  const fixtureDir = mkdtempSync(join(tmpdir(), "idealist-fixture-"))
  cpSync(DIST, fixtureDir, { recursive: true })

  out("— PB build (geçici PB'ye karşı, gerçek içerikle)")
  const pb = await startPb()
  try {
    await seed(pb)
    if (!report(build({ PB_URL: pb.url }).exitCode === 0, "PB build", "çıkış kodu ≠ 0")) return 1
  } finally {
    await pb.stop()
  }

  // PB modu ile fixture modu aynı sayfaları ve aynı görünen metni üretmeli (yükleyici hatalarını yakalar)
  const a = htmlOf(fixtureDir), b = htmlOf(DIST)
  const onlyA = Object.keys(a).filter((k) => !(k in b)), onlyB = Object.keys(b).filter((k) => !(k in a))
  let all = report(onlyA.length === 0 && onlyB.length === 0, "PB ve fixture aynı sayfa kümesini üretir", `yalnız fixture: ${onlyA.slice(0, 3)} | yalnız PB: ${onlyB.slice(0, 3)}`)
  const diff = Object.keys(a).filter((k) => k in b && visible(a[k]) !== visible(b[k]))
  all = report(diff.length === 0, "PB ve fixture aynı metni üretir", `${diff.length} sayfa farklı: ${diff.slice(0, 4).join(", ")}`) && all
  rmSync(fixtureDir, { recursive: true, force: true })

  const server = serve()
  try {
    all = (await runChecks(`http://127.0.0.1:${server.port}`)) && all
    all = distChecks() && all
  } finally {
    server.stop(true)
  }
  return all ? 0 : 1
}

if (import.meta.main) process.exit(await main())
