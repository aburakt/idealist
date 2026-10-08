import type { Pb } from "./pb-harness"
import { seed } from "./seed"

// Çalışan bir PocketBase'e (ör. SSH tüneli) eski sitenin içeriğini yükler. Yalnız boş PB'ye (settings kaydı yoksa) çalışır;
// panelde yazılanı ezmez. PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD ortamdan gelir; parola komut satırına yazılmaz.
const url = (process.env.PB_URL ?? "").replace(/\/$/, "")
const identity = process.env.PB_ADMIN_EMAIL ?? ""
const password = process.env.PB_ADMIN_PASSWORD ?? ""
if (!url || !identity || !password) throw new Error("PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD gerekli")

const auth = await fetch(`${url}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ identity, password }),
})
if (!auth.ok) throw new Error(`giriş başarısız: ${auth.status}`)
const token = ((await auth.json()) as { token: string }).token

const call = (path: string, init: RequestInit = {}, authed = false) => {
  const headers = new Headers(init.headers)
  if (typeof init.body === "string" && !headers.has("content-type")) headers.set("content-type", "application/json")
  if (authed) headers.set("authorization", token)
  return fetch(`${url}${path}`, { ...init, headers })
}
const pb: Pb = { url, dir: "", token, api: (p, i) => call(p, i), admin: (p, i) => call(p, i, true), stop: async () => {} }
await seed(pb)
process.stdout.write("tohumlama tamam\n")
