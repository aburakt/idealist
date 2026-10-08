export const lines = (text: string | undefined): string[] => (text ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
export const paragraphs = lines

/** tel: bağlantısı için numara: boşluk/ayraç atılır, başa +90 eklenir (0312… -> +90312…). */
export const telHref = (phone: string): string => {
  const d = phone.replace(/[^\d+]/g, "")
  return `tel:${d.startsWith("+") ? d : d.startsWith("0") ? `+9${d}` : `+90${d}`}`
}

const num = new Intl.NumberFormat("tr-TR")
/** 150000 -> "150.000 m²" */
export const formatM2 = (m2: number): string => `${num.format(m2)} m²`
export const formatNumber = (n: number): string => num.format(n)

/** Proje kartındaki kısa bilgi satırı: kullanım · yıl · konum (boş olanlar atlanır). */
export const projectMeta = (p: { usage: string; year?: number; location: string }): string =>
  [p.usage, p.year ? String(p.year) : "", p.location].filter(Boolean).join(" · ")
