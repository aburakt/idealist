// Proje galerisi: görsele tıklayınca tam ekran görüntüleyici (<dialog>). Betik yüklenmezse bağlantı büyük görseli açar.
const viewer = document.querySelector<HTMLDialogElement>("[data-viewer]")
const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-gallery-item]")]

if (viewer && links.length) {
  const img = viewer.querySelector<HTMLImageElement>("[data-viewer-img]")!
  const count = viewer.querySelector<HTMLElement>("[data-viewer-count]")!
  const prev = viewer.querySelector<HTMLButtonElement>("[data-viewer-prev]")!
  const next = viewer.querySelector<HTMLButtonElement>("[data-viewer-next]")!
  let index = 0

  const show = (i: number) => {
    index = (i + links.length) % links.length
    const link = links[index]!
    img.src = link.href
    img.alt = link.querySelector("img")?.alt ?? ""
    count.textContent = `${index + 1} / ${links.length}`
  }
  prev.hidden = next.hidden = links.length < 2

  links.forEach((link, i) =>
    link.addEventListener("click", (e) => {
      e.preventDefault()
      show(i)
      viewer.showModal()
    }))
  prev.addEventListener("click", () => show(index - 1))
  next.addEventListener("click", () => show(index + 1))
  viewer.querySelector("[data-viewer-close]")?.addEventListener("click", () => viewer.close())
  viewer.addEventListener("click", (e) => { if (e.target === viewer || e.target === img.parentElement) viewer.close() })
  viewer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1)
    if (e.key === "ArrowRight") show(index + 1)
  })
}
