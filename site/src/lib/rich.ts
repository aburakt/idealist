import { getImage } from "astro:assets"
import { bodyImage } from "./content"
import { remoteDims } from "./image"
import { sanitize } from "./sanitize"
import type { Img } from "./types"

const attr = (tag: string, name: string): string | undefined => tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1]
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")

/** Bir görseli metin genişliğine (en fazla 1200 px) WebP olarak üretir; asıl boyuttan büyütmez. */
async function imageTag(img: Img, alt: string): Promise<string> {
  const { src } = img
  let width: number, height: number, widths: number[]
  if (typeof src === "string") ({ width, height, widths } = await remoteDims(src, 1200, [480, 800, 1200]))
  else {
    width = Math.min(1200, src.width)
    height = Math.round((src.height * width) / src.width)
    widths = [...new Set([480, 800].filter((w) => w < width).concat(width))]
  }
  const out = await getImage({ src, width, height, widths, format: "webp", quality: 80 })
  return `<img src="${out.src}" srcset="${out.srcSet.attribute}" sizes="(min-width: 760px) 720px, 100vw" width="${width}" height="${height}" alt="${esc(alt)}" loading="lazy" decoding="async">`
}

/** Temizlenmiş HTML; içindeki görseller build'de indirilip optimize edilir (CSP img-src 'self'). Çözülemeyen görsel atılır. */
export async function renderRich(html: string): Promise<string> {
  const clean = sanitize(html ?? "")
  const tags = [...new Set(clean.match(/<img\b[^>]*>/gi) ?? [])]
  const done = new Map<string, string>()
  await Promise.all(tags.map(async (tag) => {
    const src = attr(tag, "src")
    const img = src ? bodyImage(src) : undefined
    done.set(tag, img ? await imageTag(img, attr(tag, "alt") ?? "") : "")
  }))
  return clean.replace(/<img\b[^>]*>/gi, (t) => done.get(t) ?? "")
}
