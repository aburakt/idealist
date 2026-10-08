// Seçili faaliyet alanı yatay şeritte görünmüyorsa ortalanır (sayfa kaydırılmaz, yalnız şerit).
for (const nav of document.querySelectorAll<HTMLElement>("[data-area-nav]")) {
  const active = nav.querySelector<HTMLElement>("[aria-current=page]")
  if (active) nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2
}
