// SİTEYE ÖZEL: GEO ve WebMCP için sitenin tanımı (template örneğinden; rehber template docs/geo-webmcp.md).
// Core çıktılar (/llms.txt, /llms-full.txt, /robots.txt, /<yol>/index.md, /webmcp.json, WebMCP araçları) yalnız bunu okur.
// Veri sayfalarla aynı yerden gelir (loadSite: PB ya da fixture); PB/fixture paritesi bu dosyaları da karşılaştırır.
import { loadSite, pageOf, projectsIn } from "./content"
import { formatDate, formatM2, lines, projectMeta, telHref } from "./format"
import { type GeoLink, type GeoSite, htmlToMarkdown } from "./llms"

export async function geo(): Promise<GeoSite> {
  const site = await loadSite()
  const { settings: s, services, areas, projects, posts } = site
  const about = pageOf(site, "hakkimizda")
  const en = pageOf(site, "en")
  const address = lines(s.address).join(", ")
  const contactLines = [
    s.phone && `- Telefon: ${[s.phone, s.phone2].filter(Boolean).join(", ")}`,
    s.email && `- E-posta: ${s.email}`,
    address && `- Adres: ${address}`,
  ].filter(Boolean).join("\n")

  const home = [
    `# ${s.heroTitle}`,
    s.heroText,
    "## Hizmetler",
    services.map((x) => `- **${x.title}**: ${x.summary}`).join("\n"),
    "## Faaliyet alanları",
    areas.map((a) => `- [${a.title}](/faaliyet-alanlari/${a.slug}/) (${projectsIn(site, a.slug).length} proje)`).join("\n"),
    "## Seçili projeler",
    projects.filter((p) => p.featured).map((p) => `- [${p.name}](/projeler/${p.slug}/): ${projectMeta(p)}`).join("\n"),
    "## İletişim",
    contactLines,
  ].filter(Boolean).join("\n\n")

  const projectPage = (p: (typeof projects)[number]) => {
    const facts: [string, string][] = [
      ["Kullanım", p.usage],
      ["İşveren", p.client],
      ["Mimari", p.architect],
      ["Yıl", p.year ? String(p.year) : ""],
      ["Konum", p.location],
      ["Alan", p.areaM2 ? formatM2(p.areaM2) : ""],
    ]
    const areaNames = areas.filter((a) => p.areas.includes(a.slug)).map((a) => a.title)
    return {
      path: `/projeler/${p.slug}/`,
      title: p.name,
      description: [p.usage, p.location].filter(Boolean).join(" · "),
      content: [
        facts.filter((f) => f[1]).map(([k, v]) => `- ${k}: ${v}`).join("\n"),
        areaNames.length ? `Faaliyet alanı: ${areaNames.join(", ")}` : "",
        p.summary,
      ].filter(Boolean).join("\n\n"),
    }
  }

  const contact: GeoLink[] = [
    ...(s.whatsappUrl ? [{ label: "WhatsApp", url: s.whatsappUrl, kind: "whatsapp" as const, description: "WhatsApp üzerinden yazın." }] : []),
    ...(s.phone ? [{ label: "Telefon", url: telHref(s.phone), kind: "phone" as const }] : []),
    ...(s.email ? [{ label: "E-posta", url: `mailto:${s.email}`, kind: "email" as const }] : []),
    { label: "İletişim sayfası", url: "/iletisim/", kind: "other", description: "Adres, telefon ve harita." },
  ]

  return {
    name: s.companyName,
    summary: s.seoDescription || s.heroText,
    details: s.aboutSummary,
    facts: { Telefon: [s.phone, s.phone2].filter(Boolean).join(", "), "E-posta": s.email, Adres: address, Kuruluş: s.foundedYear ? String(s.foundedYear) : undefined },
    sections: [
      {
        title: "Sayfalar",
        pages: [
          { path: "/", title: "Ana sayfa", description: s.seoDescription, content: home },
          { path: "/iletisim/", title: "İletişim", description: "Adres, telefon ve e-posta.", content: contactLines },
        ],
      },
      {
        title: "Hakkımızda",
        pages: [{ path: "/hakkimizda/", title: about.title, description: about.seoDescription || "Kuruluş, misyon ve kadro", content: htmlToMarkdown(about.body) }],
      },
      {
        title: "Hizmetler",
        pages: [{
          path: "/#hizmetler",
          title: "Hizmetler",
          description: services.map((x) => x.title).join(", "),
        }],
      },
      {
        title: "Faaliyet Alanları",
        pages: areas.map((a) => {
          const list = projectsIn(site, a.slug)
          return {
            path: `/faaliyet-alanlari/${a.slug}/`,
            title: a.title,
            description: `${list.length} proje`,
            content: [list.map((p) => `- [${p.name}](/projeler/${p.slug}/): ${projectMeta(p)}`).join("\n")].join("\n\n"),
          }
        }),
      },
      {
        title: "Projeler",
        pages: [
          { path: "/projeler/", title: "Projeler", description: `${projects.length} mekanik tesisat projesi` },
          ...projects.map(projectPage),
        ],
      },
      {
        title: "Blog",
        pages: [
          { path: "/blog/", title: "Blog", description: "Mekanik tesisat üzerine yazılar" },
          ...posts.map((p) => ({
            path: `/blog/${p.slug}/`,
            title: p.title,
            description: p.excerpt,
            date: p.date,
            content: [`${formatDate(p.date)} · ${p.category}`, htmlToMarkdown(p.body)].filter(Boolean).join("\n\n"),
          })),
        ],
      },
      {
        title: "English",
        pages: [{ path: "/en/", title: en.title || "Idealist Engineering", description: en.seoDescription || "Company summary in English", content: htmlToMarkdown(en.body) }],
      },
    ],
    contact,
    aiTraining: true,
  }
}
