import type { AreaIcon, ServiceIcon } from "./types"

/** Icon.astro'daki simge adları. Panelde seçilen hizmet/faaliyet alanı simgeleri bunun alt kümesidir. */
export type IconName =
  | "arrow-right" | "arrow-left" | "phone" | "mail" | "pin" | "fax" | "menu" | "close" | "expand" | "globe-lang"
  | ServiceIcon | AreaIcon
