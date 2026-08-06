import { describe, expect, it } from 'vitest'
import { extractJson, parseAiIntent } from '../src/lib/ai'

describe('extractJson', () => {
  it('unwraps a json fence', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toBe('{"a":1}')
  })
  it('unwraps a bare fence', () => {
    expect(extractJson('```\n{"a":1}\n```')).toBe('{"a":1}')
  })
  it('finds a raw object amid prose', () => {
    expect(extractJson('here you go: {"type":"url"} enjoy')).toBe('{"type":"url"}')
  })
  it('returns empty when no object', () => {
    expect(extractJson('no json here')).toBe('')
  })
})

describe('parseAiIntent', () => {
  it('parses wifi intent', () => {
    const i = parseAiIntent('{"type":"wifi","fields":{"ssid":"Guest","password":"hunter2"}}')
    expect(i.type).toBe('wifi')
    expect(i.fields.ssid).toBe('Guest')
    expect(i.fields.password).toBe('hunter2')
  })
  it('coerces non-string field values', () => {
    const i = parseAiIntent('{"type":"upi","fields":{"pa":"x@y","am":50}}')
    expect(i.fields.am).toBe('50')
  })
  it('preserves booleans', () => {
    const i = parseAiIntent('{"type":"wifi","fields":{"ssid":"H","hidden":true}}')
    expect(i.fields.hidden).toBe(true)
  })
  it('drops null fields', () => {
    const i = parseAiIntent('{"type":"url","fields":{"url":"x.com","note":null}}')
    expect('note' in i.fields).toBe(false)
  })
  it('rejects unknown type', () => {
    expect(() => parseAiIntent('{"type":"bogus","fields":{}}')).toThrow()
  })
  it('rejects reply with no json', () => {
    expect(() => parseAiIntent('sorry I cannot help')).toThrow()
  })
})
