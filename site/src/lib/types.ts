export type Img = { src: ImageMetadata | string }

/** Site Ayarları (PB `settings`, tek kayıt). */
export type Settings = {
  companyName: string; legalName: string; tagline: string; phone: string; phone2: string; fax: string; email: string; address: string; mapUrl: string
  heroTitle: string; heroText: string; heroImage?: Img; aboutSummary: string; foundedYear?: number; footerText: string; seoDescription: string; shareImage?: Img
  whatsappUrl: string
}
/** Sabit sayfa (Hakkımızda, İngilizce sayfa). `body` panel editöründen gelen HTML'dir. */
export type Page = { slug: string; title: string; body: string; seoDescription?: string }
export type ServiceIcon = "mep" | "structure" | "design" | "management"
export type Service = { title: string; titleEn: string; icon: ServiceIcon; summary: string }
export type AreaIcon = "mixed" | "institution" | "health" | "hotel" | "home" | "office" | "school" | "mall" | "social" | "industry" | "sport" | "globe"
/** Faaliyet alanı = proje kategorisi. */
export type Area = { slug: string; title: string; titleEn: string; icon: AreaIcon }
export type Project = {
  slug: string; name: string; areas: string[]; usage: string; client: string; architect: string; year?: number; location: string; areaM2?: number
  summary: string; images: Img[]; featured: boolean
}

/** Blog yazısı. `date` YYYY-MM-DD; `body` panel editöründen gelen HTML. */
export type Post = { slug: string; title: string; date: string; category: string; excerpt: string; body: string; cover?: Img }

export type Site = {
  settings: Settings
  pages: Page[]
  services: Service[]
  areas: Area[]
  projects: Project[]
  posts: Post[]
}
