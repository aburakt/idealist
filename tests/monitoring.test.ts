// ORTAK (core): tarayıcı hata takibi (ErrorTracking.astro) siteye doğru bağlanmış mı.
import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { allowConnect } from "../site/integrations/pb-csp"
import { IGNORE_ERRORS } from "../site/src/lib/error-tracking"
import { GLITCHTIP_DSN } from "../site/src/lib/monitoring"

const ROOT = join(import.meta.dir, "..")
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8")

describe("tarayıcı hata takibi", () => {
  test("DSN boş ya da bu sitenin GlitchTip projesi", () => {
    if (GLITCHTIP_DSN) expect(GLITCHTIP_DSN).toMatch(/^https:\/\/[0-9a-f]{32}@glitchtip\.aburakt\.com\/\d+$/)
  })

  test("CSP: DSN varken build GlitchTip kökenini connect-src'ye ekler (pb-csp)", () => {
    expect(allowConnect("connect-src 'self';", new URL("https://k@glitchtip.aburakt.com/1").origin)).toBe("connect-src 'self' https://glitchtip.aburakt.com;")
  })

  test("GEO'lu her layout <ErrorTracking /> içerir", () => {
    const dir = join(ROOT, "site/src/layouts")
    const layouts = readdirSync(dir).filter((f) => f.endsWith(".astro"))
    const withGeo = layouts.filter((f) => read("site/src/layouts", f).includes("<Geo "))
    expect(withGeo.length).toBeGreaterThan(0)
    for (const f of withGeo) expect(read("site/src/layouts", f), f).toContain("<ErrorTracking />")
  })

  test("gürültü filtresi bilinen gürültüyü eler, gerçek hatayı elemez", () => {
    const ignored = (m: string) => IGNORE_ERRORS.some((r) => r.test(m))
    expect(ignored("Non-Error promise rejection captured with value: Object Not Found Matching Id:2, MethodName:update, ParamCount:4")).toBe(true)
    expect(ignored("AbortError: Skipping view transition because skipTransition() was called.")).toBe(true)
    expect(ignored("TypeError: Cannot read properties of undefined (reading 'id')")).toBe(false)
    expect(ignored("Object Not Found")).toBe(false)
    expect(ignored("TypeError: Load failed")).toBe(false)
  })
})
