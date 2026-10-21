// ORTAK (core): template'ten gelir, sitede elle değiştirilmez (bun run core:sync).
// E-posta logosu: Gmail ve Outlook SVG göstermez. site/public/logo.svg'den şeffaf PNG üretilir (pages/brand/[file].png.ts).
// Kutu 400x80 px (e-postada 200x40 gösterilir, yüksek yoğunluklu ekranda keskin): logo oranı korunarak sığdırılır,
// kutuda ortalanır. pb_hooks/lib/mail.js img'ye width=200 height=40 yazar; kutu sabit olduğu için Outlook da doğru ölçer.
import sharp from "sharp"

export const MAIL_LOGO = { width: 400, height: 80 } as const

export async function mailLogoPng(svg: string | Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const src = Buffer.from(svg)
  const { width: W, height: H } = MAIL_LOGO
  // SVG'nin kendi boyutundan bağımsız keskin çizim: kutuyu dolduracak ölçeğin iki katı yoğunlukla rasterleştirilir
  const meta = await sharp(src).metadata()
  const scale = Math.min(W / (meta.width || W), H / (meta.height || H))
  const density = Math.max(72, Math.min(2400, Math.round(72 * scale * 2)))
  const logo = await sharp(src, { density }).resize({ width: W, height: H, fit: "inside" }).png().toBuffer()
  const m = await sharp(logo).metadata()
  const png = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, left: Math.round((W - (m.width ?? W)) / 2), top: Math.round((H - (m.height ?? H)) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer()
  return new Uint8Array(png)
}
