# oriz-qr — QR studio

- **Live app:** https://qr.oriz.in
- **About / info:** https://chirag127.github.io/oriz-qr/
- **For LLMs:** https://qr.oriz.in/llms.txt

Generate and scan QR codes entirely in your browser. Make codes for links, plain
text, Wi-Fi, contacts (vCard), UPI payments, email and SMS — restyle the ink and
paper colors, drop a logo in the center, tune error-correction, then export PNG
or SVG. Flip to **Scan** to read any QR with your camera or a dropped image.

**100% client-side, no upload, no signup, free.** Every payload is built and every
code is decoded on your device; nothing touches a server.

## Features

- **7 payload types** — URL, text, Wi-Fi, contact (vCard 3.0), UPI, email, SMS.
- **Restyle** — pick any ink + paper color, add a logo overlay, choose error-correction (L/M/Q/H).
- **Export** — download as PNG (canvas) or crisp SVG (vector).
- **Scan** — live camera decode (`getUserMedia` + `jsQR`) or decode a dropped/picked image.
- **AI describe** (optional) — type "wifi for guests, password hunter2" and it fills the right fields. Uses the shared `@chirag127/oz-ai` g4f client with multi-provider failover; if AI is down the tool still works.
- **PWA-installable**, offline-capable.

## Stack

Astro (static) + React 19 islands + Tailwind v4. Heavy libs (`qrcode`, `jsQR`)
are dynamically imported only when you trigger generate/scan, so first paint is
instant. Shared `@chirag127/oz-*` atomic packages provide the AI client, file
helpers, token contract and oriz.in chrome. Deployed on Cloudflare Pages; the
info page is served from GitHub Pages.

## Develop

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:4321
npm test           # vitest — pure payload + AI-parser logic
npm run build      # static dist/
npm run deploy     # build + wrangler pages deploy
```

## License

MIT © 2026 Chirag Singhal
