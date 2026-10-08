import content from "../data/content.json"
import postsData from "../data/posts.json"
import { byDateDesc } from "./format"
import { loadFromPb } from "./pb-loader"
import { isFixtureMode, pbUrl } from "./pb"
import type { Area, Img, Post, Project, Site } from "./types"

const assets = import.meta.glob<{ default: ImageMetadata }>("../assets/media/*.webp", { eager: true })

/** content.json'daki görsel adı (ör. santra-1.webp) -> optimize edilecek yerel görsel. */
export function localImage(name?: string): Img | undefined {
  const mod = name ? assets[`../assets/media/${name}`] : undefined
  return mod ? { src: mod.default } : undefined
}

/**
 * Zengin metindeki (sayfa gövdesi) <img src>: yerel ad ya da panel dosyası. Panel dosyası hangi adresle eklendiyse
 * (SSH tüneli, cms alan adı, göreli) build'deki PB_URL'ye çevrilir. Başka sitelerden gelen görsel CSP'de engelli; atılır.
 */
export function bodyImage(src: string): Img | undefined {
  const file = src.match(/^(?:https?:\/\/[^/]+)?(\/api\/files\/[^?#"]+)/)?.[1]
  if (file) return isFixtureMode() ? undefined : { src: `${pbUrl()}${file}` }
  return /^https?:\/\//.test(src) ? undefined : localImage(src)
}

function fromFixture(): Site {
  const c = content
  const s = c.settings
  return {
    settings: {
      companyName: s.companyName, legalName: s.legalName, tagline: s.tagline, phone: s.phone, phone2: s.phone2, fax: s.fax, email: s.email,
      address: s.address, mapUrl: s.mapUrl, heroTitle: s.heroTitle, heroText: s.heroText, heroImage: localImage(s.heroImage),
      aboutSummary: s.aboutSummary, foundedYear: s.foundedYear || undefined, footerText: s.footerText, seoDescription: s.seoDescription,
      whatsappUrl: "",
    },
    pages: [
      { slug: "hakkimizda", ...c.pages.about },
      { slug: "en", ...c.pages.en },
    ],
    services: c.services.map((x) => ({ ...x, icon: x.icon as Site["services"][number]["icon"] })),
    areas: c.areas.map<Area>((a) => ({ ...a, icon: a.icon as Area["icon"] })),
    projects: c.projects.map<Project>((p) => ({
      slug: p.slug, name: p.name, areas: p.areas, usage: p.usage, client: p.client, architect: p.architect, year: p.year || undefined,
      location: p.location, areaM2: p.areaM2 || undefined, summary: p.summary, featured: p.featured > 0,
      images: p.images.map((n) => localImage(n)).filter((x): x is Img => !!x),
    })),
    posts: postsData.map<Post>((p) => ({ ...p, cover: localImage(p.cover) })).sort(byDateDesc),
  }
}

let cache: Promise<Site> | undefined

/** Tüm içeriği bir kez yükler. CONTENT_SOURCE=fixture dışında PB gerekir; yoksa build kırılır. */
export function loadSite(): Promise<Site> {
  if (isFixtureMode()) return (cache ??= Promise.resolve(fromFixture()))
  pbUrl() // PB_URL yoksa burada hata fırlatır; build kırılır, boş site yayına çıkmaz
  return (cache ??= loadFromPb())
}

/** Yalnız yayında olan alanlara bağlı projeler, alan sırasıyla. */
export const projectsIn = (site: Site, area: string): Project[] => site.projects.filter((p) => p.areas.includes(area))
export const pageOf = (site: Site, slug: string) => {
  const page = site.pages.find((p) => p.slug === slug)
  if (!page) throw new Error(`sayfa yok: ${slug}`)
  return page
}
