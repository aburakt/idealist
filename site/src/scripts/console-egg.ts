// Konsolu açana küçük imza (easter egg). Yalnızca console; sayfada görünür bir şey yok.
const en = document.documentElement.lang === "en"
// oxlint-disable-next-line no-console -- bu dosyanın tek işi konsola yazmak
console.log(
  `%c${en ? "Idealist Engineering" : "İdealist Mühendislik"}%c\n${en ? "Built by" : "Bu site"} %caburakt.com%c${en ? "" : " tarafından geliştirildi."}\n%chttps://aburakt.com`,
  "font: 600 18px/1.4 system-ui, sans-serif; color: #e3000f",
  "font: 13px/1.6 system-ui, sans-serif; color: inherit",
  "font: 600 13px/1.6 ui-monospace, monospace; color: #e3000f",
  "font: 13px/1.6 system-ui, sans-serif; color: inherit",
  "font: 12px/1.6 ui-monospace, monospace; color: #888",
)
