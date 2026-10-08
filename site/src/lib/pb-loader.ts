import { fileUrl, listAll } from "./pb"
import { byDateDesc } from "./format"
import type { Area, Img, Page, Post, Project, Service, Site } from "./types"

type Rec = { id: string; collectionId: string }
type RawSettings = Rec & {
  company_name: string; legal_name: string; tagline: string; phone: string; phone2: string; fax: string; email: string; address: string; map_url: string
  hero_title: string; hero_text: string; hero_image: string; about_summary: string; founded_year: number; footer_text: string; seo_description: string; share_image: string
  whatsapp_url: string
}
type RawPage = Rec & { slug: string; title: string; body: string; seo_description: string }
type RawService = Rec & { title: string; title_en: string; icon: Service["icon"]; summary: string }
type RawArea = Rec & { slug: string; title: string; title_en: string; icon: Area["icon"] }
type RawProject = Rec & {
  slug: string; name: string; areas: string[]; usage: string; client: string; architect: string; year: number; location: string; area_m2: number
  summary: string; images: string[]; featured: boolean
}
type RawPost = Rec & { slug: string; title: string; date: string; category: string; excerpt: string; body: string; cover: string }

const file = (r: Rec, name: string): Img | undefined => (name ? { src: fileUrl(r, name) } : undefined)

/** Tüm içeriği PB'den çeker (yalnız public kurallarla) ve doğrular. Eksik zorunlu içerik build'i kırar. */
export async function loadFromPb(): Promise<Site> {
  const [settingsList, pages, services, areas, projects, posts] = await Promise.all([
    listAll<RawSettings>("settings", { sort: "created" }),
    listAll<RawPage>("pages", { sort: "slug" }),
    listAll<RawService>("services"),
    listAll<RawArea>("areas"),
    listAll<RawProject>("projects"),
    listAll<RawPost>("posts", { sort: "-date,title" }),
  ])
  const s = settingsList[0]
  if (!s?.company_name || !s.phone || !s.email) throw new Error("Site Ayarları (settings) kaydı yok ya da firma adı/telefon/e-posta boş")
  if (projects.length === 0) throw new Error("hiç proje yok")
  for (const slug of ["hakkimizda", "en"]) if (!pages.some((p) => p.slug === slug)) throw new Error(`sayfa yok: ${slug}`)
  // yayında olmayan alanın id'si listede yoktur; proje o alanda görünmez
  const slugOf = new Map(areas.map((a) => [a.id, a.slug]))

  return {
    settings: {
      companyName: s.company_name, legalName: s.legal_name, tagline: s.tagline, phone: s.phone, phone2: s.phone2, fax: s.fax, email: s.email,
      address: s.address, mapUrl: s.map_url, heroTitle: s.hero_title, heroText: s.hero_text, heroImage: file(s, s.hero_image),
      aboutSummary: s.about_summary, foundedYear: s.founded_year || undefined, footerText: s.footer_text, seoDescription: s.seo_description,
      shareImage: file(s, s.share_image), whatsappUrl: s.whatsapp_url ?? "",
    },
    pages: pages.map<Page>((p) => ({ slug: p.slug, title: p.title, body: p.body, seoDescription: p.seo_description || undefined })),
    services: services.map<Service>((x) => ({ title: x.title, titleEn: x.title_en, icon: x.icon, summary: x.summary })),
    areas: areas.map<Area>((a) => ({ slug: a.slug, title: a.title, titleEn: a.title_en, icon: a.icon })),
    projects: projects.map<Project>((p) => ({
      slug: p.slug, name: p.name, areas: p.areas.map((id) => slugOf.get(id)).filter((x): x is string => !!x), usage: p.usage, client: p.client,
      architect: p.architect, year: p.year || undefined, location: p.location, areaM2: p.area_m2 || undefined, summary: p.summary,
      featured: p.featured, images: p.images.map((n) => file(p, n)).filter((x): x is Img => !!x),
    })),
    // PB tarihi "2026-10-08 00:00:00.000Z" biçiminde gelir; gün kısmı yeter
    posts: posts.map<Post>((p) => ({
      slug: p.slug, title: p.title, date: p.date.slice(0, 10), category: p.category, excerpt: p.excerpt, body: p.body, cover: file(p, p.cover),
    })).sort(byDateDesc),
  }
}
