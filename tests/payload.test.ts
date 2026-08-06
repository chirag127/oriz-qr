import { describe, expect, it } from 'vitest'
import {
  buildEmail,
  buildSms,
  buildText,
  buildUpi,
  buildUrl,
  buildVcard,
  buildWifi,
  escapeMecard,
} from '../src/lib/payload'

describe('buildUrl', () => {
  it('adds https when scheme missing', () => {
    expect(buildUrl('oriz.in')).toBe('https://oriz.in')
  })
  it('keeps existing scheme', () => {
    expect(buildUrl('http://x.com')).toBe('http://x.com')
    expect(buildUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
  })
  it('empty stays empty', () => {
    expect(buildUrl('  ')).toBe('')
  })
})

describe('buildWifi', () => {
  it('builds WPA payload', () => {
    expect(buildWifi({ ssid: 'Net', password: 'pw', encryption: 'WPA' })).toBe('WIFI:T:WPA;S:Net;P:pw;')
  })
  it('omits password for open network', () => {
    expect(buildWifi({ ssid: 'Free', encryption: 'nopass' })).toBe('WIFI:T:nopass;S:Free;')
  })
  it('adds hidden flag', () => {
    expect(buildWifi({ ssid: 'H', password: 'p', hidden: true })).toBe('WIFI:T:WPA;S:H;P:p;H:true;')
  })
  it('escapes reserved chars', () => {
    expect(buildWifi({ ssid: 'a;b', password: 'p,q' })).toBe('WIFI:T:WPA;S:a\\;b;P:p\\,q;')
  })
})

describe('escapeMecard', () => {
  it('escapes the five reserved chars', () => {
    expect(escapeMecard('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f')
  })
})

describe('buildVcard', () => {
  it('emits N + FN + fields', () => {
    const v = buildVcard({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.com' })
    expect(v).toContain('BEGIN:VCARD')
    expect(v).toContain('N:Lovelace;Ada;;;')
    expect(v).toContain('FN:Ada Lovelace')
    expect(v).toContain('EMAIL:ada@x.com')
    expect(v).toContain('END:VCARD')
  })
  it('skips empty fields', () => {
    expect(buildVcard({ firstName: 'X' })).not.toContain('ORG:')
  })
})

describe('buildUpi', () => {
  it('builds intent with defaults', () => {
    expect(buildUpi({ pa: 'me@bank' })).toBe('upi://pay?pa=me%40bank&cu=INR')
  })
  it('includes amount + name + note', () => {
    const u = buildUpi({ pa: 'me@bank', pn: 'Me', am: '10', tn: 'tip' })
    expect(u).toContain('pa=me%40bank')
    expect(u).toContain('pn=Me')
    expect(u).toContain('am=10')
    expect(u).toContain('tn=tip')
  })
})

describe('buildEmail', () => {
  it('bare to', () => {
    expect(buildEmail({ to: 'a@b.com' })).toBe('mailto:a@b.com')
  })
  it('subject + body', () => {
    expect(buildEmail({ to: 'a@b.com', subject: 'hi', body: 'yo' })).toBe('mailto:a@b.com?subject=hi&body=yo')
  })
})

describe('buildSms', () => {
  it('bare number', () => {
    expect(buildSms({ to: '+15551234' })).toBe('SMSTO:+15551234')
  })
  it('with body', () => {
    expect(buildSms({ to: '+1', body: 'hey' })).toBe('SMSTO:+1:hey')
  })
})

describe('buildText', () => {
  it('passthrough', () => {
    expect(buildText('hello world')).toBe('hello world')
  })
})
