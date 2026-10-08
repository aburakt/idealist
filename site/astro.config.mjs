// @ts-check
import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"

const site = process.env.PUBLIC_SITE_URL ?? "https://www.idealistmuhendislik.com.tr"
const pbHost = process.env.PB_URL ? new URL(process.env.PB_URL).hostname : "localhost"

export default defineConfig({
  site,
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "never" },
  integrations: [sitemap({ filter: (page) => !page.endsWith("/404/") })],
  image: { domains: [pbHost] },
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
})
