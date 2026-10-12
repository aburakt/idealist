// ORTAK (core): template'ten gelir, sitede elle değiştirilmez (bun run core:sync).
//
// Ziyaretçi formu tarayıcıdan doğrudan PocketBase'e gönderir (fetch). CSP connect-src 'self' bunu engeller;
// PB adresi siteden siteye (ve verify'da her çalıştırmada) değiştiği için _headers'a elle yazılmaz:
// build bitince PB_URL'nin kökeni dist/_headers içindeki connect-src'ye eklenir. Yalnız site.js FORMS doluysa
// ve PB modunda (CONTENT_SOURCE=fixture değil, PB_URL tanımlı) yapılır; önizlemede form kapalıdır.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"

const SITE_JS = fileURLToPath(new URL("../../pb/pb_hooks/site.js", import.meta.url))

/** _headers metnindeki her connect-src yönergesine kökeni ekler (zaten varsa dokunmaz). */
export function allowConnect(headers: string, origin: string): string {
  return headers.replace(/connect-src([^;\n]*)/g, (all, sources: string) =>
    sources.split(/\s+/).includes(origin) ? all : `connect-src${sources} ${origin}`)
}

/** site.js FORMS. Kök package.json "type": "module" olduğundan Node bu CommonJS dosyasını require edemez; metni çalıştırılır. */
function siteForms(): string[] {
  const mod: { exports: { FORMS?: string[] } } = { exports: {} }
  new Function("module", "exports", readFileSync(SITE_JS, "utf8"))(mod, mod.exports)
  return mod.exports.FORMS ?? []
}

export default function pbCsp(): AstroIntegration {
  return {
    name: "pb-csp",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const pbUrl = process.env.PB_URL
        if (process.env.CONTENT_SOURCE === "fixture" || !pbUrl) return
        let forms: string[] = []
        try {
          forms = siteForms()
        } catch (err) {
          logger.warn(`${SITE_JS} okunamadı, connect-src değişmedi: ${String(err)}`)
        }
        if (!forms.length) return
        const file = fileURLToPath(new URL("_headers", dir))
        if (!existsSync(file)) return
        const origin = new URL(pbUrl).origin
        const before = readFileSync(file, "utf8")
        const after = allowConnect(before, origin)
        if (after === before) return
        writeFileSync(file, after)
        logger.info(`connect-src: ${origin} (form gönderimi)`)
      },
    },
  }
}
