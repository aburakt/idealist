import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { formatM2, lines, projectMeta, telHref } from "../site/src/lib/format"
import { sanitize } from "../site/src/lib/sanitize"
import { loadContent } from "../scripts/seed"

const ROOT = join(import.meta.dir, "..")
const SITE = join(ROOT, "site")
const c = await loadContent()

describe("zengin metin temizliği (CSP style-src 'self')", () => {
  test("stil, sınıf, olay öznitelikleri ve betikler atılır; metin korunur", () => {
    const out = sanitize('<p style="color:red" class="x" onclick="alert(1)">a style=b</p><script>bad()</script><iframe src="x"></iframe><a href="javascript:alert(1)">l</a>')
    expect(out).toBe("<p>a style=b</p><a>l</a>")
  })
})

describe("taşınan içerik", () => {
  test("bütün görseller media klasöründe", () => {
    const names = [c.settings.heroImage, ...c.projects.flatMap((p) => p.images)]
    for (const n of names) expect(existsSync(join(SITE, "src", "assets", "media", n))).toBe(true)
  })
  test("her projenin görseli ve bilinen bir faaliyet alanı var; adresler benzersiz", () => {
    const areas = new Set(c.areas.map((a) => a.slug))
    for (const p of c.projects) {
      expect(p.images.length).toBeGreaterThan(0)
      expect(p.areas.length).toBeGreaterThan(0)
      for (const a of p.areas) expect(areas.has(a)).toBe(true)
    }
    const slugs = c.projects.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  test("her faaliyet alanında en az bir proje var", () => {
    for (const a of c.areas) expect(c.projects.some((p) => p.areas.includes(a.slug))).toBe(true)
  })
  test("simgeler şemadaki seçeneklerle aynı", () => {
    const migration = readFileSync(join(ROOT, "pb", "pb_migrations", "1791500000_init.js"), "utf8")
    for (const a of c.areas) expect(migration).toContain(`"${a.icon}"`)
    for (const s of c.services) expect(migration).toContain(`"${s.icon}"`)
  })
  test("eski adresler yeni adreslere yönlenir", () => {
    const redirects = readFileSync(join(SITE, "public", "_redirects"), "utf8")
    expect(redirects).toContain("/projects.html /projeler/ 301")
    expect(redirects).toContain("/en.html /en/ 301")
  })
  test("hiçbir gövdede stil özniteliği yok", () => {
    for (const b of [c.pages.about.body, c.pages.en.body]) expect(b).not.toMatch(/\sstyle=|\sclass=/)
  })
})

describe("biçim yardımcıları", () => {
  test("telefon bağlantısı uluslararası biçimde", () => {
    expect(telHref("+90 (312) 905 55 66")).toBe("tel:+903129055566")
    expect(telHref("0312 905 55 66")).toBe("tel:+903129055566")
  })
  test("alan Türkçe binlik ayraçla", () => {
    expect(formatM2(1333255)).toBe("1.333.255 m²")
  })
  test("proje bilgi satırı boş alanları atlar", () => {
    expect(projectMeta({ usage: "Hastane", year: 2021, location: "" })).toBe("Hastane · 2021")
    expect(projectMeta({ usage: "", location: "Bolu" })).toBe("Bolu")
  })
  test("satır listesi boşlukları atar", () => {
    expect(lines(" a \n\n b\r\n")).toEqual(["a", "b"])
  })
})
