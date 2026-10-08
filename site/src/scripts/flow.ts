// Hero arka planı: mekanik tesisat şeması gibi akan hatlar. Izgaraya oturan dik açılı "boru" hatları çizilir,
// üzerlerinde sıcak (kırmızı) ve soğuk (gri-mavi) akış parçacıkları ilerler. Fare/parmak yakınındaki hatlar
// parlar ve akış hızlanır (yay yumuşatmalı, ani sıçrama yok). Görünmezken ve sekme arkadayken durur;
// "hareketi azalt" tercihinde tek kare çizilir. Kütüphane yok; yalnız canvas.

type Pt = { x: number; y: number }
type Route = { pts: Pt[]; len: number[]; total: number; hot: boolean }
type Particle = { route: Route; s: number; speed: number; size: number }

const reduced = matchMedia("(prefers-reduced-motion: reduce)")
const HOT = "oklch(0.64 0.23 27.5)"
const COLD = "oklch(0.78 0.05 240)"
const PIPE = "oklch(1 0 0 / 0.07)"

function start(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  let w = 0, h = 0, cell = 40, routes: Route[] = [], parts: Particle[] = [], frame = 0, visible = true, last = 0
  // fare konumu ve yumuşatılmış etki gücü (kritik sönümlü yaya yakın: hedefe üstel yaklaşım)
  const pointer = { x: -1e4, y: -1e4, power: 0, target: 0 }

  const snap = (v: number) => Math.round(v / cell) * cell

  /** Izgarada dik açılarla dönen rastgele bir hat (kanal/boru güzergâhı). */
  const makeRoute = (hot: boolean): Route => {
    const pts: Pt[] = []
    const vertical = Math.random() < 0.5
    let x = vertical ? snap(Math.random() * w) : -cell
    let y = vertical ? -cell : snap(Math.random() * h)
    let dir = vertical ? 1 : 0 // 0 = sağa, 1 = aşağı
    pts.push({ x, y })
    for (let guard = 0; guard < 40 && x <= w + cell && y <= h + cell; guard++) {
      const run = cell * (2 + Math.floor(Math.random() * 6))
      if (dir === 0) x += run; else y += run
      pts.push({ x, y })
      dir = dir === 0 ? 1 : 0
    }
    const len = [0]
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1]! + Math.abs(pts[i]!.x - pts[i - 1]!.x) + Math.abs(pts[i]!.y - pts[i - 1]!.y))
    return { pts, len, total: len[len.length - 1]!, hot }
  }

  const at = (r: Route, s: number): Pt => {
    let i = 1
    while (i < r.len.length - 1 && r.len[i]! < s) i++
    const a = r.pts[i - 1]!, b = r.pts[i]!
    const t = (s - r.len[i - 1]!) / Math.max(1, r.len[i]! - r.len[i - 1]!)
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  }

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    w = rect.width; h = rect.height
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    cell = w < 640 ? 32 : 44
    const n = Math.max(6, Math.min(16, Math.round((w * h) / 70000)))
    routes = Array.from({ length: n }, (_, i) => makeRoute(i % 3 === 0))
    parts = routes.flatMap((r) => Array.from({ length: Math.max(2, Math.round(r.total / 260)) }, () => ({
      route: r, s: Math.random() * r.total, speed: 38 + Math.random() * 46, size: r.hot ? 2.2 : 1.7,
    })))
    draw()
  }

  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    // hatlar ve dirsek noktaları
    ctx.lineWidth = 1
    ctx.strokeStyle = PIPE
    ctx.fillStyle = PIPE
    for (const r of routes) {
      ctx.beginPath()
      r.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.stroke()
      for (const p of r.pts) ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
    }
    // akış: her parçacık kısa, uca doğru incelen bir kuyrukla
    for (const p of parts) {
      const head = at(p.route, p.s)
      const near = Math.max(0, 1 - Math.hypot(head.x - pointer.x, head.y - pointer.y) / 220) * pointer.power
      const tail = 26 + near * 40
      ctx.strokeStyle = p.route.hot ? HOT : COLD
      for (let k = 0; k < 6; k++) {
        const a = at(p.route, Math.max(0, p.s - (tail * k) / 6)), b = at(p.route, Math.max(0, p.s - (tail * (k + 1)) / 6))
        ctx.globalAlpha = (1 - k / 6) * (0.55 + near * 0.45)
        ctx.lineWidth = p.size * (1 - k / 8)
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      }
      ctx.globalAlpha = 0.9
      ctx.fillStyle = p.route.hot ? HOT : COLD
      ctx.beginPath(); ctx.arc(head.x, head.y, p.size + near * 1.6, 0, Math.PI * 2); ctx.fill()
    }
    // fare çevresinde yumuşak ışık
    if (pointer.power > 0.01) {
      const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 220)
      g.addColorStop(0, `oklch(0.64 0.23 27.5 / ${0.12 * pointer.power})`)
      g.addColorStop(1, "transparent")
      ctx.globalAlpha = 1
      ctx.fillStyle = g
      ctx.fillRect(pointer.x - 220, pointer.y - 220, 440, 440)
    }
    ctx.globalAlpha = 1
  }

  const step = (now: number) => {
    frame = 0
    if (!visible || document.hidden || reduced.matches) return
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
    last = now
    pointer.power += (pointer.target - pointer.power) * (1 - Math.exp(-dt / 0.12))
    for (const p of parts) {
      const head = at(p.route, p.s)
      const near = Math.max(0, 1 - Math.hypot(head.x - pointer.x, head.y - pointer.y) / 220) * pointer.power
      p.s += p.speed * (1 + near * 1.8) * dt
      if (p.s > p.route.total) p.s -= p.route.total
    }
    draw()
    frame = requestAnimationFrame(step)
  }
  const play = () => { if (!frame) { last = 0; frame = requestAnimationFrame(step) } }

  new ResizeObserver(resize).observe(canvas)
  new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible) play() }).observe(canvas)
  document.addEventListener("visibilitychange", play)
  reduced.addEventListener("change", () => { draw(); play() })
  const host = canvas.parentElement ?? canvas
  host.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect()
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.target = 1
    if (reduced.matches) { pointer.power = 1; draw() }
  })
  host.addEventListener("pointerleave", () => { pointer.target = 0; if (reduced.matches) { pointer.power = 0; draw() } })
  play()
}

for (const c of document.querySelectorAll<HTMLCanvasElement>("canvas[data-flow]")) start(c)
