import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('../public/icons/', import.meta.url))
const any = readFileSync(dir + 'icon.svg')
const mask = readFileSync(dir + 'icon-maskable.svg')

const jobs = [
  [any, 192, 'icon-192.png'],
  [any, 256, 'icon-256.png'],
  [any, 384, 'icon-384.png'],
  [any, 512, 'icon-512.png'],
  [mask, 512, 'icon-maskable-512.png'],
]

for (const [buf, size, name] of jobs) {
  await sharp(buf, { density: 384 })
    .resize(size, size, { fit: 'contain', background: '#ffffff' })
    .png()
    .toFile(dir + name)
  console.log('wrote', name, size)
}
