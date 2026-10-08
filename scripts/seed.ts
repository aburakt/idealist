import { join } from "node:path"
import type { Pb } from "./pb-harness"

// site/src/data/content.json + görseller -> PocketBase. Gerçek içeriği ilk kez PB'ye yükler ve testlerde kullanılır.
const SITE = join(import.meta.dir, "..", "site")
const MEDIA = join(SITE, "src", "assets", "media")

type Json = Record<string, unknown>
export type Content = {
  settings: {
    companyName: string; legalName: string; tagline: string; phone: string; phone2: string; fax: string; email: string; address: string; mapUrl: string
    heroTitle: string; heroText: string; heroImage: string; aboutSummary: string; foundedYear: number; footerText: string; seoDescription: string
  }
  pages: Record<"about" | "en", { title: string; body: string }>
  services: { title: string; titleEn: string; icon: string; summary: string }[]
  areas: { slug: string; title: string; titleEn: string; icon: string }[]
  projects: {
    slug: string; name: string; areas: string[]; usage: string; client: string; architect: string; year: number; location: string; areaM2: number
    images: string[]; featured: number; summary: string; note: string
  }[]
}
export const loadContent = async (): Promise<Content> => (await Bun.file(join(SITE, "src", "data", "content.json")).json()) as Content

const blob = async (name: string) => new Blob([await Bun.file(join(MEDIA, name)).arrayBuffer()], { type: "image/webp" })

/** Kayıt açar (ya da `id` verilirse günceller). Boş alanlar gönderilmez; görseller media klasöründen yüklenir. */
export async function save(pb: Pb, collection: string, fields: Json, files: Record<string, string | string[] | undefined> = {}, id?: string): Promise<Json> {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === "" || v === 0) continue
    if (Array.isArray(v)) for (const x of v) form.append(k, String(x))
    else form.set(k, String(v))
  }
  for (const [field, names] of Object.entries(files)) for (const n of [names].flat()) if (n) form.append(field, await blob(n), n)
  const res = await pb.admin(`/api/collections/${collection}/records${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: form })
  if (!res.ok) throw new Error(`seed ${collection}: ${res.status} ${await res.text()}`)
  return (await res.json()) as Json
}

const first = async (pb: Pb, collection: string, filter = ""): Promise<Json | undefined> => {
  const qs = new URLSearchParams({ perPage: "1", sort: "created", ...(filter ? { filter } : {}) })
  const res = await pb.admin(`/api/collections/${collection}/records?${qs}`)
  if (!res.ok) throw new Error(`seed ${collection}: ${res.status} ${await res.text()}`)
  return ((await res.json()) as { items: Json[] }).items[0]
}

/** Boş bir PB'yi içerikle doldurur. Site Ayarları zaten varsa (canlıda) hiçbir şey yapmaz. */
export async function seed(pb: Pb): Promise<void> {
  if (await first(pb, "settings")) throw new Error("PB dolu (settings kaydı var); tohumlama yalnız boş PB'ye yapılır")
  const c = await loadContent()
  const s = c.settings
  await save(pb, "settings", {
    company_name: s.companyName, legal_name: s.legalName, tagline: s.tagline, phone: s.phone, phone2: s.phone2, fax: s.fax, email: s.email,
    address: s.address, map_url: s.mapUrl, hero_title: s.heroTitle, hero_text: s.heroText, about_summary: s.aboutSummary,
    founded_year: s.foundedYear, footer_text: s.footerText, seo_description: s.seoDescription,
  }, { hero_image: s.heroImage })
  for (const [key, slug] of [["about", "hakkimizda"], ["en", "en"]] as const) {
    const page = await first(pb, "pages", `slug = "${slug}"`)
    if (!page) throw new Error(`sayfa kaydı yok: ${slug} (migration 1791500000 uygulanmamış)`)
    await save(pb, "pages", { title: c.pages[key].title, body: c.pages[key].body }, {}, page.id as string)
  }
  const pos = (i: number) => (i + 1) * 10
  for (const [i, x] of c.services.entries()) await save(pb, "services", { title: x.title, title_en: x.titleEn, icon: x.icon, summary: x.summary, position: pos(i), published: true })
  const areaId = new Map<string, string>()
  for (const [i, a] of c.areas.entries()) {
    const rec = await save(pb, "areas", { title: a.title, title_en: a.titleEn, icon: a.icon, slug: a.slug, position: pos(i), published: true })
    areaId.set(a.slug, rec.id as string)
  }
  for (const [i, p] of c.projects.entries()) {
    await save(pb, "projects", {
      name: p.name, slug: p.slug, areas: p.areas.map((a) => areaId.get(a)), usage: p.usage, client: p.client, architect: p.architect,
      year: p.year, location: p.location, area_m2: p.areaM2, summary: p.summary, featured: p.featured > 0, position: pos(i), published: true,
    }, { images: p.images })
  }
}
