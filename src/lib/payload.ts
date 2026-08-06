/**
 * QR payload builders — pure functions, no DOM. Each returns the exact string
 * encoded into a QR code for a given content type. Unit-tested.
 */

export type WifiEnc = 'WPA' | 'WEP' | 'nopass'

/** Escape reserved chars in WIFI: / MECARD-style payloads (\ ; , : "). */
export function escapeMecard(v: string): string {
  return v.replace(/([\\;,:"])/g, '\\$1')
}

export interface WifiInput {
  ssid: string
  password?: string
  encryption?: WifiEnc
  hidden?: boolean
}

/** WIFI:T:WPA;S:ssid;P:pass;H:true; */
export function buildWifi({ ssid, password = '', encryption = 'WPA', hidden = false }: WifiInput): string {
  const enc = encryption === 'nopass' ? 'nopass' : encryption
  const parts = [`T:${enc}`, `S:${escapeMecard(ssid)}`]
  if (enc !== 'nopass') parts.push(`P:${escapeMecard(password)}`)
  if (hidden) parts.push('H:true')
  return `WIFI:${parts.join(';')};`
}

export interface VcardInput {
  firstName?: string
  lastName?: string
  org?: string
  title?: string
  phone?: string
  email?: string
  url?: string
  address?: string
}

/** vCard 3.0 — the most widely scanned contact format. */
export function buildVcard(i: VcardInput): string {
  const first = (i.firstName ?? '').trim()
  const last = (i.lastName ?? '').trim()
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  lines.push(`N:${last};${first};;;`)
  const fn = [first, last].filter(Boolean).join(' ')
  if (fn) lines.push(`FN:${fn}`)
  if (i.org?.trim()) lines.push(`ORG:${i.org.trim()}`)
  if (i.title?.trim()) lines.push(`TITLE:${i.title.trim()}`)
  if (i.phone?.trim()) lines.push(`TEL;TYPE=CELL:${i.phone.trim()}`)
  if (i.email?.trim()) lines.push(`EMAIL:${i.email.trim()}`)
  if (i.url?.trim()) lines.push(`URL:${i.url.trim()}`)
  if (i.address?.trim()) lines.push(`ADR:;;${i.address.trim()};;;;`)
  lines.push('END:VCARD')
  return lines.join('\n')
}

export interface UpiInput {
  pa: string // VPA, e.g. name@bank
  pn?: string // payee name
  am?: string // amount
  cu?: string // currency, default INR
  tn?: string // note
}

/** upi://pay?pa=...&pn=...&am=...&cu=INR&tn=... (BharatQR/UPI intent). */
export function buildUpi({ pa, pn, am, cu = 'INR', tn }: UpiInput): string {
  const q = new URLSearchParams()
  q.set('pa', pa.trim())
  if (pn?.trim()) q.set('pn', pn.trim())
  if (am != null && String(am).trim() !== '') q.set('am', String(am).trim())
  if (cu?.trim()) q.set('cu', cu.trim())
  if (tn?.trim()) q.set('tn', tn.trim())
  return `upi://pay?${q.toString()}`
}

export interface EmailInput {
  to: string
  subject?: string
  body?: string
}

/** mailto:to?subject=...&body=... */
export function buildEmail({ to, subject, body }: EmailInput): string {
  const q = new URLSearchParams()
  if (subject?.trim()) q.set('subject', subject.trim())
  if (body?.trim()) q.set('body', body.trim())
  const qs = q.toString()
  return `mailto:${to.trim()}${qs ? `?${qs}` : ''}`
}

export interface SmsInput {
  to: string
  body?: string
}

/** SMSTO:number:message — the format scanners open in the SMS composer. */
export function buildSms({ to, body }: SmsInput): string {
  const num = to.trim()
  return body?.trim() ? `SMSTO:${num}:${body.trim()}` : `SMSTO:${num}`
}

/** Plain text — passthrough (trimmed of trailing whitespace only lightly). */
export function buildText(raw: string): string {
  return raw
}

/** Normalize a URL — add https:// if the user omitted a scheme. */
export function buildUrl(raw: string): string {
  const v = raw.trim()
  if (!v) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) || /^(mailto|tel|upi|sms|geo|bitcoin):/i.test(v)) return v
  return `https://${v}`
}

export type PayloadType = 'text' | 'url' | 'wifi' | 'vcard' | 'upi' | 'email' | 'sms'

export const PAYLOAD_TYPES: { id: PayloadType; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'url', label: 'URL' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'vcard', label: 'Contact' },
  { id: 'upi', label: 'UPI' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
]
