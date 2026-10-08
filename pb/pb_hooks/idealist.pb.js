/// <reference path="../pb_data/types.d.ts" />

// Not: hook handler'ları izole çalışır; ortak kod handler içinde require() ile yüklenir.
// Yeni içerik koleksiyonu eklenirse BURAYA da eklenir; yoksa değişiklik siteye yansımaz.
const CONTENT = ["settings", "pages", "services", "areas", "projects"]

onRecordAfterCreateSuccess((e) => {
  require(`${__hooks}/lib/deploy.js`).markDirty(e.app)
  e.next()
}, ...CONTENT)

onRecordAfterUpdateSuccess((e) => {
  require(`${__hooks}/lib/deploy.js`).markDirty(e.app)
  e.next()
}, ...CONTENT)

onRecordAfterDeleteSuccess((e) => {
  require(`${__hooks}/lib/deploy.js`).markDirty(e.app)
  e.next()
}, ...CONTENT)

// Panel korumaları (tek kayıt, sabit sayfalar, kilitli adresler): kurallar lib/protect.js'te.
onRecordCreateRequest((e) => {
  require(`${__hooks}/lib/protect.js`).beforeCreate(e)
  e.next()
}, "settings", "pages", "areas", "projects")

onRecordUpdateRequest((e) => {
  require(`${__hooks}/lib/protect.js`).beforeUpdate(e)
  e.next()
}, "settings", "pages", "areas", "projects")

onRecordDeleteRequest((e) => {
  require(`${__hooks}/lib/protect.js`).beforeDelete(e)
  e.next()
}, "settings", "pages", "areas")

cronAdd("idealist_deploy", "* * * * *", () => {
  require(`${__hooks}/lib/deploy.js`).flush($app, false)
})

// Elle yeniden yayınlama: POST /api/idealist/deploy (superuser token ile)
routerAdd("POST", "/api/idealist/deploy", (e) => {
  const result = require(`${__hooks}/lib/deploy.js`).flush(e.app, true)
  return e.json(result.ok ? 200 : 500, result)
}, $apis.requireSuperuserAuth())
