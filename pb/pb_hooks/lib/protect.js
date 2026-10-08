/// <reference path="../../pb_data/types.d.ts" />

// Panel korumaları. Müşteri superuser olduğu için API kuralları değil, istek (request) hook'ları kullanılır;
// panele de API'ye de uygulanır, migration ve sistem işlerini etkilemez.
//
// - settings (Site Ayarları): tek kayıt; ikinci kayıt açılamaz, silinemez (silinse site telefon/adres bilgisini kaybeder, build kırılır).
// - pages: iki sabit sayfa (Hakkımızda, İngilizce sayfa); yeni kayıt açılamaz, silinemez, gizlenemez, adresi değiştirilemez.
// - areas: faaliyet alanı silinemez (projeler ona bağlı); gizlemek için yayın işareti kaldırılır. Adres addan üretilir, kilitlenir.
// - projects: adres (slug) boşsa addan üretilir; kaydedildikten sonra değiştirilemez.

const RULES = {
  settings: { label: "Site Ayarları", singleton: true, noDelete: true },
  pages: { label: "Sayfalar", noCreate: true, noDelete: true, locked: ["slug"], alwaysPublished: true },
  areas: { label: "Faaliyet alanları", noDelete: true, slugFrom: "title", locked: ["slug"] },
  projects: { slugFrom: "name", locked: ["slug"] },
}

function slugify(s) {
  const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" }
  return String(s || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/̇/g, "")
    .replace(/[çğıöşüâîû]/g, (ch) => map[ch])
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/, "")
}

function taken(collection, value, exceptId) {
  return $app.countRecords(collection, $dbx.hashExp({ slug: value }), $dbx.not($dbx.hashExp({ id: exceptId || "" }))) > 0
}

/** slug boşsa başlıktan benzersiz bir adres üretir. */
function fillSlug(record, rule) {
  if (!rule.slugFrom || record.getString("slug")) return
  const name = record.collection().name
  const base = slugify(record.getString(rule.slugFrom)) || "kayit"
  let candidate = base
  for (let i = 2; taken(name, candidate, record.id); i++) candidate = `${base}-${i}`
  record.set("slug", candidate)
}

function beforeCreate(e) {
  const name = e.record.collection().name
  const rule = RULES[name]
  if (!rule) return
  if (rule.noCreate) throw new BadRequestError(`${rule.label} koleksiyonuna yeni kayıt eklenemez; var olan kayıtları düzenleyin.`)
  if (rule.singleton && $app.countRecords(name) > 0) throw new BadRequestError(`${rule.label} tek kayıttır; yeni kayıt açmak yerine var olan kaydı düzenleyin.`)
  fillSlug(e.record, rule)
}

function beforeUpdate(e) {
  const name = e.record.collection().name
  const rule = RULES[name]
  if (!rule) return
  const original = e.record.original()
  for (const field of rule.locked || []) {
    const before = original.getString(field)
    if (before && e.record.getString(field) !== before) {
      throw new BadRequestError(`"${field}" alanı değiştirilemez (sitedeki bağlantılar buna bağlı). Eski değer: ${before}`)
    }
  }
  if (rule.alwaysPublished && !e.record.getBool("published")) throw new BadRequestError("Bu sayfa gizlenemez; \"published\" işaretli kalmalı.")
  fillSlug(e.record, rule)
}

function beforeDelete(e) {
  const name = e.record.collection().name
  const rule = RULES[name]
  if (rule && rule.noDelete) throw new BadRequestError(`${rule.label} kayıtları silinemez; metni değiştirin ya da yayın işaretini kaldırın.`)
}

module.exports = { RULES, slugify, beforeCreate, beforeUpdate, beforeDelete }
