// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import AstroPWA from '@vite-pwa/astro'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://qr.oriz.in',
  output: 'static',
  integrations: [
    react(),
    sitemap(),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'oriz QR',
        short_name: 'QR',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#c6ff00',
        description: 'Generate & scan QR codes in your browser — 100% client-side, no upload.',
        categories: ['tools'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          { src: '/icons/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
          { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
          { src: '/icons/icon-256.png', type: 'image/png', sizes: '256x256', purpose: 'any' },
          { src: '/icons/icon-384.png', type: 'image/png', sizes: '384x384', purpose: 'any' },
          { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/screenshots/desktop.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide', label: 'QR studio on desktop' },
          { src: '/screenshots/mobile.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'QR studio on mobile' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        navigateFallback: '/',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              /pollinations\.ai|deepinfra|puter|g4f|gpt4free/.test(url.hostname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'oz-ai',
              networkTimeoutSeconds: 20,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
