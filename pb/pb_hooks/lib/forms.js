/// <reference path="../../pb_data/types.d.ts" />

// ORTAK (core): template'ten gelir, sitede elle değiştirilmez.
//
// Ziyaretçi formları (site.js FORMS): spam tuzağı, KVKK onayı, e-posta bildirimi, saklama süresi.
// Ayarlar site.js FORM_OPTIONS'tan (isteğe bağlı), varsayılanlar aşağıda. forms.pb.js bu dosyayı handler içinde yükler.
//
// Koleksiyonda beklenen (hepsi isteğe bağlı) alanlar:
//   status (select: new, spam, ...)  ziyaretçi gönderiminde hook doldurur: tuzak doluysa "spam", değilse "new"
//   kvkk_consent (bool)              varsa ziyaretçi işaretlemeden gönderemez (400)
//   email                            bildirim e-postasında Reply-To olur
//   notes vb. (FORM_OPTIONS.staffFields)  yalnız panelden yazılır; ziyaretçinin gönderdiği değer silinir
// Bildirim alıcısı: settings kaydında form_recipient alanı varsa ve doluysa o, yoksa sunucu .env FORM_NOTIFY_TO.

const DEFAULTS = {
  // KVKK: bu kadar günden eski başvurular her gece silinir
  retentionDays: 365,
  // Spam tuzağı: formda gizli, insanın doldurmadığı alan (koleksiyonda alan olması gerekmez)
  honeypot: "website",
  // Yalnız panelden yazılan alanlar (ziyaretçinin gönderdiği değer yok sayılır)
  staffFields: ["notes"],
}

const CONSENT_MSG = "Formu gönderebilmek için kişisel verilerin işlenmesine ilişkin aydınlatma metnini onaylamanız gerekir."
// E-postada gösterilmeyen alanlar (tuzak ve personel alanları ayrıca çıkarılır)
const SKIP = ["id", "status", "kvkk_consent", "created", "updated"]

function options() {
  const site = require(`${__hooks}/site.js`)
  return Object.assign({}, DEFAULTS, site.FORM_OPTIONS || {})
}

function hasField(collection, name) {
  return !!collection.fields.getByName(name)
}

function esc(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Panel etiketleri (panel/labels.json): koleksiyon.alan, alan, yoksa alanın kendi adı. */
function labels() {
  try {
    return JSON.parse(toString($os.readFile(`${__hooks}/panel/labels.json`)))
  } catch {
    return { collections: {}, fields: {} }
  }
}

function display(value) {
  if (value === null || value === undefined) return ""
  if (value === true) return "Evet"
  if (value === false) return ""
  if (Array.isArray(value)) return value.map(display).filter(Boolean).join(", ")
  if (typeof value === "object") {
    const s = String(value)
    return s === "[object Object]" ? JSON.stringify(value) : s
  }
  return String(value)
}

function recipient(app) {
  let to = $os.getenv("FORM_NOTIFY_TO") || ""
  try {
    const settings = app.findCollectionByNameOrId("settings")
    if (hasField(settings, "form_recipient")) {
      const rec = app.findFirstRecordByFilter("settings", "form_recipient != ''")
      to = rec.getString("form_recipient") || to
    }
  } catch { /* settings yok ya da alan boş */ }
  return to.trim()
}

module.exports = {
  CONSENT_MSG,

  /** onRecordCreateRequest: ziyaretçi gönderiminde status, KVKK onayı ve personel alanları. Superuser serbesttir. */
  beforeCreate(e) {
    if (e.hasSuperuserAuth()) return
    const opts = options()
    const col = e.record.collection()
    const body = e.requestInfo().body || {}

    if (hasField(col, "kvkk_consent") && !e.record.getBool("kvkk_consent")) {
      throw new BadRequestError(CONSENT_MSG)
    }
    for (const name of opts.staffFields) {
      if (hasField(col, name)) e.record.set(name, null)
    }
    if (hasField(col, "status")) {
      const trap = String(body[opts.honeypot] || "").trim()
      e.record.set("status", trap ? "spam" : "new")
    }
  },

  /** onRecordAfterCreateSuccess: spam değilse bildirim e-postası. Hata yalnız loglanır, isteği bozmaz. */
  notify(app, record) {
    try {
      if (record.getString("status") === "spam") return
      const to = recipient(app)
      if (!to) return

      const opts = options()
      const col = record.collection()
      const names = labels()
      const skip = SKIP.concat(opts.staffFields, [opts.honeypot])
      let rows = ""
      for (const f of col.fields) {
        const name = f.getName()
        if (f.getHidden() || f.getSystem() || skip.includes(name)) continue
        const value = display(record.get(name))
        if (!value) continue
        const label = names.fields[`${col.name}.${name}`] || names.fields[name] || name
        rows += `<tr><th align="left" valign="top">${esc(label)}</th><td>${esc(value).replace(/\r?\n/g, "<br>")}</td></tr>`
      }

      const title = names.collections[col.name] || col.name
      const meta = app.settings().meta
      const headers = {}
      const replyTo = hasField(col, "email") ? record.getString("email") : ""
      if (replyTo) headers["Reply-To"] = replyTo
      // konu satırına ziyaretçi metni girer: satır sonları atılır
      const who = String((hasField(col, "name") && record.getString("name")) || replyTo || record.id).replace(/[\r\n]+/g, " ").slice(0, 120)

      const message = new MailerMessage({
        from: { address: meta.senderAddress, name: meta.senderName },
        to: [{ address: to }],
        subject: `[Web] ${title}: ${who}`,
        html: `<p>Web sitesinden yeni bir form gönderimi geldi (${esc(title)}).</p>`
          + `<table cellpadding="4">${rows}</table>`
          + `<p>Panelde: ${esc(col.name)} / ${esc(record.id)}</p>`,
        headers,
      })
      app.newMailClient().send(message)
    } catch (err) {
      app.logger().error("Form bildirimi gönderilemedi", "collection", record.collection().name, "record", record.id, "error", String(err))
    }
  },

  /** Günlük cron: saklama süresini aşan gönderimleri siler (KVKK). Silinen kayıt sayısını döndürür. */
  purge(app) {
    const site = require(`${__hooks}/site.js`)
    const days = Number(options().retentionDays)
    if (!(days > 0)) return 0
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().replace("T", " ")
    let removed = 0
    for (const name of site.FORMS || []) {
      try {
        const old = app.findRecordsByFilter(name, "created < {:cutoff}", "created", 0, 0, { cutoff })
        for (const r of old) {
          app.delete(r)
          removed++
        }
      } catch (err) {
        app.logger().error("Eski form gönderimleri silinemedi", "collection", name, "error", String(err))
      }
    }
    if (removed) app.logger().info("Saklama süresi dolan form gönderimleri silindi", "count", removed, "days", days)
    return removed
  },
}
