/**
 * Turn AI free-text into a structured QR intent. The network call lives in
 * @chirag127/oz-ai; this module owns the prompt + the (testable) JSON parser.
 */
import type { PayloadType } from './payload'

export interface AiIntent {
  type: PayloadType
  fields: Record<string, string | boolean>
}

const VALID: PayloadType[] = ['text', 'url', 'wifi', 'vcard', 'upi', 'email', 'sms']

export const AI_SYSTEM = `You convert a user's natural-language request into a QR-code payload spec.
Reply with ONLY a JSON object, no prose, no markdown fences. Shape:
{"type":"wifi|url|text|vcard|upi|email|sms","fields":{...}}
Field keys by type:
- wifi: ssid, password, encryption (WPA|WEP|nopass), hidden (true|false)
- url: url
- text: text
- vcard: firstName, lastName, org, title, phone, email, url, address
- upi: pa (VPA), pn (payee name), am (amount), tn (note)
- email: to, subject, body
- sms: to, body
Only include fields you can infer. Guess the most likely type.`

/** Pull the first {...} block out of a model reply (handles ```json fences). */
export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : raw
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return ''
  return body.slice(start, end + 1)
}

/** Parse + validate an AI reply into an AiIntent. Throws on unusable output. */
export function parseAiIntent(raw: string): AiIntent {
  const json = extractJson(raw)
  if (!json) throw new Error('no JSON in AI reply')
  const obj = JSON.parse(json) as { type?: string; fields?: Record<string, unknown> }
  const type = (obj.type ?? '').toLowerCase() as PayloadType
  if (!VALID.includes(type)) throw new Error(`unknown type: ${obj.type}`)
  const fields: Record<string, string | boolean> = {}
  for (const [k, v] of Object.entries(obj.fields ?? {})) {
    if (v == null) continue
    fields[k] = typeof v === 'boolean' ? v : String(v)
  }
  return { type, fields }
}
