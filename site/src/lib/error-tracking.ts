// ORTAK (core): GlitchTip istemci kurulumu; ErrorTracking.astro yalnız DSN varken dinamik import eder.
// Named import SDK'nın tree-shake edilmesini sağlar (namespace import replay/feedback dahil her şeyi paketler).
// KVKK: SDK v11 varsayılan olarak IP, çerez vb. kişisel veri göndermez.
import { init } from "@sentry/browser"

// Bilinen, kod hatası olmayan gürültü; GlitchTip kaydı açılmaz. Dar tutulur, her satırın kanıtı var.
export const IGNORE_ERRORS: RegExp[] = [
  // Outlook/Defender bağlantı tarayıcısının (SafeLinks) iç köprüsü; Error olmayan promise reddi,
  // stack'i yok (GlitchTip YIBDER-4, RLA-GLOBAL-5/6, DFC-TURKIYE-2).
  /Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+/,
  // Kullanıcı geçiş bitmeden yeni sayfaya tıklayınca Astro View Transitions'ın kendi iptali (YIBDER-3).
  /Skipping view transition because skipTransition\(\) was called/,
]

export function initErrorTracking(dsn: string): void {
  init({
    dsn,
    environment: "production",
    // Yalnız hata; performans olayları kotayı doldurmaz.
    tracesSampleRate: 0,
    // Tarayıcı eklentisi ve üçüncü taraf betik gürültüsü alınmaz.
    allowUrls: [window.location.origin],
    ignoreErrors: IGNORE_ERRORS,
  })
}
