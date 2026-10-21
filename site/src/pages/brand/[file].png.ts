// ORTAK (core): template'ten gelir, sitede elle değiştirilmez (bun run core:sync).
// /brand/logo-mail.png: site/public/logo.svg varsa e-posta logosu (lib/mail-logo.ts). Logo yoksa dosya üretilmez;
// e-postalar ve panel site adını yazıyla gösterir. pb_hooks/site.js BRAND.logo bu dosyanın tam adresini gösterir.
import type { APIRoute } from "astro"
import { mailLogoPng } from "../../lib/mail-logo"

const logos = import.meta.glob<string>("/public/logo.svg", { query: "?raw", import: "default" })

export function getStaticPaths() {
  return Object.keys(logos).length ? [{ params: { file: "logo-mail" } }] : []
}

export const GET: APIRoute = async () => {
  const svg = await Object.values(logos)[0]!()
  return new Response(await mailLogoPng(svg), { headers: { "content-type": "image/png" } })
}
