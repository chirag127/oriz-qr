# PWABuilder packaging — oriz QR

- **Live URL:** https://qr.oriz.in
- **Android package id:** `in.oriz.qr`
- **Signing SHA-256:** `0C:82:DB:11:57:7E:21:8D:62:1E:54:DF:3B:33:D1:29:6E:77:56:80:36:22:C1:99:36:DF:03:D3:6F:0D:30:36`

Digital Asset Links live at `https://qr.oriz.in/.well-known/assetlinks.json` (already deployed) — this verifies the Android TWA.

## Steps

PWABuilder.com -> enter URL `https://qr.oriz.in` -> Package For Stores -> Android (use existing signing key, package `in.oriz.qr`) / Windows / iOS.

- **Android:** on the signing dialog pick "Use existing" and paste the SHA-256 above (fingerprint already in `assetlinks.json`), package name `in.oriz.qr`.
- **Windows:** default MSIX options.
- **iOS:** default Safari-based package.
