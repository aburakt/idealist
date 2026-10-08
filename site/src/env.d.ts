/// <reference path="../.astro/types.d.ts" />
interface ImportMetaEnv {
  readonly PB_URL?: string
  readonly PUBLIC_SITE_URL?: string
  readonly NOINDEX?: string
  readonly CONTENT_SOURCE?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
