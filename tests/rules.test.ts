import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { startPb, type Pb } from "../scripts/pb-harness"
import { type Content, type PostSeed, loadContent, loadPosts, seed } from "../scripts/seed"

let pb: Pb
let content: Content
let posts: PostSeed[]
beforeAll(async () => {
  content = await loadContent()
  posts = await loadPosts()
  pb = await startPb()
  await seed(pb)
}, 300_000)
afterAll(async () => {
  await pb?.stop()
})

type Item = { id: string; collectionId: string; slug?: string; images?: string[]; areas?: string[] }
const list = async (c: string, qs = "") => {
  const res = await pb.api(`/api/collections/${c}/records?perPage=1&${qs}`)
  return { status: res.status, total: ((await res.json()) as { totalItems: number }).totalItems }
}
const create = (c: string, body: Record<string, unknown>) =>
  pb.admin(`/api/collections/${c}/records`, { method: "POST", body: JSON.stringify(body) })
const patch = (c: string, id: string, body: Record<string, unknown>) => pb.admin(`/api/collections/${c}/records/${id}`, { method: "PATCH", body: JSON.stringify(body) })
const del = (c: string, id: string) => pb.admin(`/api/collections/${c}/records/${id}`, { method: "DELETE" })
const firstOf = async (c: string, filter = ""): Promise<Item> =>
  ((await (await pb.admin(`/api/collections/${c}/records?perPage=1${filter ? "&filter=" + enc(filter) : ""}`)).json()) as { items: Item[] }).items[0]!
const enc = encodeURIComponent
const COLLECTIONS = ["settings", "pages", "services", "areas", "projects", "posts"]

describe("gerçek içerik tohumlandı", () => {
  test("anonim okuyucu beklenen sayıda kayıt görür", async () => {
    expect((await list("settings")).total).toBe(1)
    expect((await list("pages")).total).toBe(2)
    expect((await list("services")).total).toBe(content.services.length)
    expect((await list("areas")).total).toBe(content.areas.length)
    expect((await list("projects")).total).toBe(content.projects.length)
    expect((await list("posts")).total).toBe(posts.length)
  })
  test("proje görselleri ve faaliyet alanı ilişkileri yüklenir", async () => {
    const p = await firstOf("projects", 'slug = "sheraton-batum"')
    expect(p.images!.length).toBe(3)
    expect(p.areas!.length).toBe(2)
  })
})

describe("taslak sızıntısı", () => {
  test("yayında olmayan kayıtlar anonim listede ve id ile görünmez", async () => {
    const area = await firstOf("areas")
    const drafts: [string, Record<string, unknown>][] = [
      ["services", { title: "Taslak hizmet", icon: "mep", published: false }],
      ["areas", { title: "Taslak alan", icon: "home", published: false }],
      ["posts", { title: "Taslak yazı", date: "2026-10-08 00:00:00.000Z", body: "<p>x</p>", published: false }],
    ]
    for (const [c, body] of drafts) {
      const res = await create(c, body)
      expect(res.status).toBe(200)
      const id = ((await res.json()) as { id: string }).id
      expect((await list(c, "filter=" + enc("published = false"))).total).toBe(0)
      expect((await pb.api(`/api/collections/${c}/records/${id}`)).status).toBe(404)
    }
    // proje görsel ister: var olan bir projeyi taslağa alıp geri yayınla
    const p = await firstOf("projects")
    expect((await patch("projects", p.id, { published: false })).status).toBe(200)
    expect((await pb.api(`/api/collections/projects/records/${p.id}`)).status).toBe(404)
    expect((await patch("projects", p.id, { published: true })).status).toBe(200)
    expect(area.id.length).toBeGreaterThan(0)
  })
})

describe("yazma kuralları", () => {
  for (const c of COLLECTIONS) {
    test(`${c}: anonim create/update/delete reddedilir`, async () => {
      const first = ((await (await pb.api(`/api/collections/${c}/records?perPage=1`)).json()) as { items: { id: string }[] }).items[0]!
      const created = await pb.api(`/api/collections/${c}/records`, { method: "POST", body: JSON.stringify({ title: "x" }) })
      expect([400, 403]).toContain(created.status)
      const upd = await pb.api(`/api/collections/${c}/records/${first.id}`, { method: "PATCH", body: JSON.stringify({ title: "x" }) })
      expect([403, 404]).toContain(upd.status)
      const d = await pb.api(`/api/collections/${c}/records/${first.id}`, { method: "DELETE" })
      expect([403, 404]).toContain(d.status)
    })
  }
})

describe("panel korumaları", () => {
  test("Site Ayarları tek kayıttır ve silinemez", async () => {
    expect((await create("settings", { company_name: "x", phone: "1", email: "a@b.co", address: "x", hero_title: "x" })).status).toBe(400)
    expect((await del("settings", (await firstOf("settings")).id)).status).toBe(400)
  })
  test("sabit sayfalar: yeni kayıt, silme, gizleme ve adres değişikliği reddedilir; metin düzenlenir", async () => {
    expect((await create("pages", { slug: "yeni", title: "Yeni", published: true })).status).toBe(400)
    const page = await firstOf("pages", 'slug = "hakkimizda"')
    expect((await del("pages", page.id)).status).toBe(400)
    expect((await patch("pages", page.id, { published: false })).status).toBe(400)
    expect((await patch("pages", page.id, { slug: "kurumsal" })).status).toBe(400)
    expect((await patch("pages", page.id, { seo_description: "Yeni açıklama" })).status).toBe(200)
  })
  test("faaliyet alanı silinemez; adresi addan üretilir (Türkçe karakter) ve kilitlenir", async () => {
    const res = await create("areas", { title: "Veri Merkezleri & Altyapı", icon: "industry", published: true })
    expect(res.status).toBe(200)
    const a = (await res.json()) as { id: string; slug: string }
    expect(a.slug).toBe("veri-merkezleri-altyapi")
    expect((await patch("areas", a.id, { slug: "baska" })).status).toBe(400)
    expect((await del("areas", a.id)).status).toBe(400)
  })
  test("proje adresi boşsa addan üretilir, çakışırsa numaralanır, sonra değiştirilemez", async () => {
    const area = await firstOf("areas", 'slug = "saglik"')
    const p = await firstOf("projects", 'slug = "koru-hastanesi"')
    const res = await patch("projects", p.id, { name: "Koru Hastanesi Ek Bina" })
    expect(res.status).toBe(200)
    expect(((await res.json()) as { slug: string }).slug).toBe("koru-hastanesi")
    expect((await patch("projects", p.id, { slug: "koru" })).status).toBe(400)
    // yeni proje görselsiz açılamaz (images zorunlu)
    expect((await create("projects", { name: "Görselsiz", areas: [area.id], published: true })).status).toBe(400)
  })
  test("blog yazısı adresi başlıktan Türkçe karaktersiz üretilir, sonra değiştirilemez", async () => {
    const res = await create("posts", { title: "Isı Geri Kazanımlı Havalandırma Çözümleri", date: "2026-10-08 00:00:00.000Z", body: "<p>x</p>", published: false })
    expect(res.status).toBe(200)
    const post = (await res.json()) as { id: string; slug: string }
    expect(post.slug).toBe("isi-geri-kazanimli-havalandirma-cozumleri")
    expect((await patch("posts", post.id, { slug: "baska" })).status).toBe(400)
    expect((await del("posts", post.id)).status).toBe(204)
  })
  test("panel adı, gizli şema düğmeleri; kullanılmayan users koleksiyonu yok; her alanda yardım metni", async () => {
    const s = (await (await pb.admin("/api/settings")).json()) as { meta: { appName: string; hideControls: boolean } }
    expect(s.meta.appName).toBe("İdealist Mühendislik Site Yönetimi")
    expect(s.meta.hideControls).toBe(true)
    expect((await pb.admin("/api/collections/users")).status).toBe(404)
    const cols = ((await (await pb.admin("/api/collections?perPage=200")).json()) as { items: { name: string; system: boolean; fields: { name: string; help: string; system: boolean; type: string; presentable: boolean }[] }[] }).items.filter((c) => !c.system)
    const missing = cols.flatMap((c) => c.fields.filter((f) => !f.system && f.type !== "autodate" && !f.help).map((f) => `${c.name}.${f.name}`))
    expect(missing).toEqual([])
    expect(cols.filter((c) => !c.fields.some((f) => f.presentable)).map((c) => c.name)).toEqual([])
  })
})

describe("şema bütünlüğü", () => {
  test("Türkçe karakterli slug reddedilir", async () => {
    expect((await create("areas", { title: "t", icon: "home", slug: "Kötü Slug" })).status).toBe(400)
  })
  test("geçersiz simge reddedilir", async () => {
    expect((await create("services", { title: "x", icon: "yok" })).status).toBe(400)
  })
  test("yedek, rate limit ve güvenilir proxy ayarları migration ile gelir", async () => {
    const s = (await (await pb.admin("/api/settings")).json()) as { backups: { cron: string; cronMaxKeep: number }; rateLimits: { enabled: boolean; rules: { label: string }[] }; trustedProxy: { headers: string[] } }
    expect(s.backups.cron).toBe("0 3 * * *")
    expect(s.backups.cronMaxKeep).toBe(7)
    expect(s.rateLimits.enabled).toBe(true)
    expect(s.rateLimits.rules.map((r) => r.label)).toContain("*:file")
    expect(s.trustedProxy.headers).toEqual(["X-Forwarded-For"])
  })
})
