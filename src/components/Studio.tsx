import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildEmail,
  buildSms,
  buildText,
  buildUpi,
  buildUrl,
  buildVcard,
  buildWifi,
  PAYLOAD_TYPES,
  type PayloadType,
  type WifiEnc,
} from '../lib/payload'
import { AI_SYSTEM, parseAiIntent } from '../lib/ai'

type Fields = Record<string, string | boolean>

const DEFAULTS: Record<PayloadType, Fields> = {
  text: { text: '' },
  url: { url: '' },
  wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
  vcard: { firstName: '', lastName: '', org: '', title: '', phone: '', email: '', url: '', address: '' },
  upi: { pa: '', pn: '', am: '', tn: '' },
  email: { to: '', subject: '', body: '' },
  sms: { to: '', body: '' },
}

function s(f: Fields, k: string): string {
  const v = f[k]
  return typeof v === 'string' ? v : ''
}

/** Assemble the encoded string from the active type + its fields. */
function encode(type: PayloadType, f: Fields): string {
  switch (type) {
    case 'text':
      return buildText(s(f, 'text'))
    case 'url':
      return buildUrl(s(f, 'url'))
    case 'wifi':
      return buildWifi({
        ssid: s(f, 'ssid'),
        password: s(f, 'password'),
        encryption: (s(f, 'encryption') || 'WPA') as WifiEnc,
        hidden: f.hidden === true,
      })
    case 'vcard':
      return buildVcard({
        firstName: s(f, 'firstName'),
        lastName: s(f, 'lastName'),
        org: s(f, 'org'),
        title: s(f, 'title'),
        phone: s(f, 'phone'),
        email: s(f, 'email'),
        url: s(f, 'url'),
        address: s(f, 'address'),
      })
    case 'upi':
      return buildUpi({ pa: s(f, 'pa'), pn: s(f, 'pn'), am: s(f, 'am'), tn: s(f, 'tn') })
    case 'email':
      return buildEmail({ to: s(f, 'to'), subject: s(f, 'subject'), body: s(f, 'body') })
    case 'sms':
      return buildSms({ to: s(f, 'to'), body: s(f, 'body') })
  }
}

function Field({
  label,
  k,
  fields,
  set,
  type = 'text',
  placeholder,
  textarea,
}: {
  label: string
  k: string
  fields: Fields
  set: (k: string, v: string | boolean) => void
  type?: string
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <div className="field">
      <label htmlFor={`f-${k}`}>{label}</label>
      {textarea ? (
        <textarea id={`f-${k}`} value={s(fields, k)} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
      ) : (
        <input id={`f-${k}`} type={type} value={s(fields, k)} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
      )}
    </div>
  )
}

function TypeForm({ type, fields, set }: { type: PayloadType; fields: Fields; set: (k: string, v: string | boolean) => void }) {
  switch (type) {
    case 'text':
      return <Field label="Text" k="text" fields={fields} set={set} textarea placeholder="Anything…" />
    case 'url':
      return <Field label="URL" k="url" fields={fields} set={set} placeholder="oriz.in" />
    case 'wifi':
      return (
        <>
          <Field label="Network (SSID)" k="ssid" fields={fields} set={set} placeholder="MyWiFi" />
          <Field label="Password" k="password" fields={fields} set={set} placeholder="••••••••" />
          <div className="row">
            <div className="field">
              <label htmlFor="f-enc">Security</label>
              <select id="f-enc" value={s(fields, 'encryption')} onChange={(e) => set('encryption', e.target.value)}>
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-hidden">Hidden network</label>
              <select id="f-hidden" value={fields.hidden === true ? 'yes' : 'no'} onChange={(e) => set('hidden', e.target.value === 'yes')}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </>
      )
    case 'vcard':
      return (
        <>
          <div className="row">
            <Field label="First name" k="firstName" fields={fields} set={set} />
            <Field label="Last name" k="lastName" fields={fields} set={set} />
          </div>
          <div className="row">
            <Field label="Organization" k="org" fields={fields} set={set} />
            <Field label="Title" k="title" fields={fields} set={set} />
          </div>
          <div className="row">
            <Field label="Phone" k="phone" fields={fields} set={set} type="tel" />
            <Field label="Email" k="email" fields={fields} set={set} type="email" />
          </div>
          <Field label="Website" k="url" fields={fields} set={set} placeholder="https://…" />
          <Field label="Address" k="address" fields={fields} set={set} />
        </>
      )
    case 'upi':
      return (
        <>
          <Field label="UPI ID (VPA)" k="pa" fields={fields} set={set} placeholder="name@bank" />
          <Field label="Payee name" k="pn" fields={fields} set={set} />
          <div className="row">
            <Field label="Amount (₹)" k="am" fields={fields} set={set} type="number" placeholder="optional" />
            <Field label="Note" k="tn" fields={fields} set={set} />
          </div>
        </>
      )
    case 'email':
      return (
        <>
          <Field label="To" k="to" fields={fields} set={set} type="email" placeholder="you@example.com" />
          <Field label="Subject" k="subject" fields={fields} set={set} />
          <Field label="Body" k="body" fields={fields} set={set} textarea />
        </>
      )
    case 'sms':
      return (
        <>
          <Field label="Phone" k="to" fields={fields} set={set} type="tel" placeholder="+91…" />
          <Field label="Message" k="body" fields={fields} set={set} textarea />
        </>
      )
  }
}

// ---- Generate panel ----
function Generator() {
  const [type, setType] = useState<PayloadType>('url')
  const [all, setAll] = useState<Record<PayloadType, Fields>>(() => structuredClone(DEFAULTS))
  const [fg, setFg] = useState('#0a0a0a')
  const [bg, setBg] = useState('#ffffff')
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [logo, setLogo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiMsg, setAiMsg] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fields = all[type]
  const set = useCallback(
    (k: string, v: string | boolean) => setAll((p) => ({ ...p, [type]: { ...p[type], [k]: v } })),
    [type],
  )

  const encoded = useMemo(() => encode(type, fields), [type, fields])
  const empty = encoded.trim() === '' || encoded === 'https://'

  // Render QR on any change (lazy-load qrcode once).
  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    if (empty) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    setBusy(true)
    setErr('')
    ;(async () => {
      try {
        const { toCanvas } = await import('qrcode')
        if (cancelled) return
        await toCanvas(canvas, encoded, {
          errorCorrectionLevel: ecc,
          margin: 2,
          width: 512,
          color: { dark: fg, light: bg },
        })
        if (cancelled) return
        if (logo) drawLogo(canvas, logo)
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'render failed')
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [encoded, empty, fg, bg, ecc, logo])

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const r = new FileReader()
    r.onload = () => setLogo(String(r.result))
    r.readAsDataURL(file)
  }

  const download = async (fmt: 'png' | 'svg') => {
    if (empty) return
    const { downloadBlob } = await import('@chirag127/oz-file')
    if (fmt === 'png') {
      canvasRef.current?.toBlob((b) => b && downloadBlob(b, 'oriz-qr.png'), 'image/png')
    } else {
      const { toString } = await import('qrcode')
      const svg = await toString(encoded, {
        type: 'svg',
        errorCorrectionLevel: ecc,
        margin: 2,
        color: { dark: fg, light: bg },
      })
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'oriz-qr.svg')
    }
  }

  const runAi = async () => {
    if (!aiPrompt.trim()) return
    setAiBusy(true)
    setAiMsg('thinking…')
    try {
      const { complete } = await import('@chirag127/oz-ai')
      const reply = await complete(aiPrompt, { system: AI_SYSTEM })
      const intent = parseAiIntent(reply)
      setType(intent.type)
      setAll((p) => ({ ...p, [intent.type]: { ...DEFAULTS[intent.type], ...intent.fields } }))
      setAiMsg(`→ ${intent.type}`)
    } catch {
      setAiMsg('AI unavailable — fill the fields manually.')
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <div className="studio">
      <div className="panel studio__form">
        <div className="ai">
          <label className="ai__label" htmlFor="ai">✦ Describe it (AI)</label>
          <div className="row" style={{ alignItems: 'stretch' }}>
            <input
              id="ai"
              value={aiPrompt}
              placeholder='e.g. "wifi for guests, password hunter2"'
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runAi()}
              style={{ flex: '3 1 12rem' }}
            />
            <button className="btn btn--accent" onClick={runAi} disabled={aiBusy || !aiPrompt.trim()} style={{ flex: '1 1 6rem' }}>
              {aiBusy ? '…' : 'Make'}
            </button>
          </div>
          {aiMsg && <p className="hint mono" aria-live="polite">{aiMsg}</p>}
        </div>

        <div className="tabs" role="tablist" aria-label="QR type">
          {PAYLOAD_TYPES.map((t) => (
            <button
              key={t.id}
              role="tab"
              className="tab"
              aria-selected={type === t.id}
              onClick={() => setType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="studio__fields">
          <TypeForm type={type} fields={fields} set={set} />
        </div>

        <fieldset className="custom">
          <legend className="mono">Style</legend>
          <div className="row">
            <label className="swatch">Ink<input type="color" value={fg} onChange={(e) => setFg(e.target.value)} /></label>
            <label className="swatch">Paper<input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
            <div className="field">
              <label htmlFor="ecc">Robustness</label>
              <select id="ecc" value={ecc} onChange={(e) => setEcc(e.target.value as 'L' | 'M' | 'Q' | 'H')}>
                <option value="L">Low</option>
                <option value="M">Medium</option>
                <option value="Q">High</option>
                <option value="H">Max (logo-safe)</option>
              </select>
            </div>
          </div>
          <div className="row" style={{ alignItems: 'center' }}>
            <label className="btn btn--ghost" style={{ cursor: 'pointer' }}>
              {logo ? 'Change logo' : 'Add logo'}
              <input type="file" accept="image/*" onChange={onLogo} hidden />
            </label>
            {logo && (
              <button className="btn btn--ghost" onClick={() => setLogo(null)}>Remove logo</button>
            )}
            {logo && <span className="hint">use Max robustness so it still scans</span>}
          </div>
        </fieldset>
      </div>

      <div className="panel studio__out">
        <div className="qr-stage">
          {empty ? (
            <div className="qr-empty mono">FILL A FIELD →<br />QR APPEARS HERE</div>
          ) : (
            <canvas ref={canvasRef} width={512} height={512} className="qr-canvas" aria-label="Generated QR code" />
          )}
          {busy && <div className="qr-busy mono">rendering…</div>}
        </div>
        {err && <p className="err">{err}</p>}
        <div className="row">
          <button className="btn" onClick={() => download('png')} disabled={empty}>Download PNG</button>
          <button className="btn" onClick={() => download('svg')} disabled={empty}>Download SVG</button>
        </div>
        {!empty && (
          <details className="raw">
            <summary className="mono">payload</summary>
            <pre className="mono">{encoded}</pre>
          </details>
        )}
      </div>
    </div>
  )
}

/** Punch a white square + center the logo image onto the QR canvas. */
function drawLogo(canvas: HTMLCanvasElement, dataUrl: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = new Image()
  img.onload = () => {
    const size = canvas.width * 0.22
    const x = (canvas.width - size) / 2
    const y = (canvas.height - size) / 2
    const pad = size * 0.12
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - pad, y - pad, size + pad * 2, size + pad * 2)
    ctx.drawImage(img, x, y, size, size)
  }
  img.src = dataUrl
}

// ---- Scan panel ----
function Scanner() {
  const [result, setResult] = useState('')
  const [err, setErr] = useState('')
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  const stop = useCallback(() => {
    setScanning(false)
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => stop, [stop])

  const startCamera = async () => {
    setErr('')
    setResult('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      setScanning(true)
      const jsQR = (await import('jsqr')).default
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const tick = () => {
        if (!streamRef.current || !ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' })
        if (code?.data) {
          setResult(code.data)
          stop()
          return
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'camera denied')
      stop()
    }
  }

  const decodeFile = async (file: File) => {
    setErr('')
    setResult('')
    try {
      const url = URL.createObjectURL(file)
      const img = new Image()
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej(new Error('bad image'))
        img.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('no canvas')
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const jsQR = (await import('jsqr')).default
      const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' })
      if (code?.data) setResult(code.data)
      else setErr('no QR code found in image')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'decode failed')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) decodeFile(file)
  }

  const isUrl = /^(https?|upi|mailto|sms|tel|smsto|wifi):/i.test(result)

  return (
    <div className="studio">
      <div className="panel studio__form">
        <p className="hint">Point your camera at a QR, or drop / pick an image. Decoding runs entirely on your device.</p>
        <div className="row">
          {scanning ? (
            <button className="btn" onClick={stop}>Stop camera</button>
          ) : (
            <button className="btn btn--accent" onClick={startCamera}>Scan with camera</button>
          )}
          <label className="btn btn--ghost" style={{ cursor: 'pointer' }}>
            Decode image
            <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && decodeFile(e.target.files[0])} />
          </label>
        </div>
        <div
          className="dropzone mono"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          drop a QR image here
        </div>
        {err && <p className="err">{err}</p>}
      </div>
      <div className="panel studio__out">
        <div className="qr-stage">
          <video ref={videoRef} className="scan-video" playsInline muted hidden={!scanning} />
          {!scanning && !result && <div className="qr-empty mono">RESULT<br />APPEARS HERE</div>}
          {!scanning && result && (
            <div className="scan-result">
              <p className="mono scan-result__text">{result}</p>
            </div>
          )}
        </div>
        {result && isUrl && (
          <a className="btn btn--accent" href={result} target="_blank" rel="noopener noreferrer">Open link</a>
        )}
        {result && (
          <button className="btn" onClick={() => navigator.clipboard?.writeText(result)}>Copy</button>
        )}
      </div>
    </div>
  )
}

export default function Studio() {
  const [mode, setMode] = useState<'generate' | 'scan'>('generate')
  return (
    <section className="app">
      <div className="tabs tabs--mode" role="tablist" aria-label="Mode">
        <button role="tab" className="tab" aria-selected={mode === 'generate'} onClick={() => setMode('generate')}>
          Generate
        </button>
        <button role="tab" className="tab" aria-selected={mode === 'scan'} onClick={() => setMode('scan')}>
          Scan
        </button>
      </div>
      {mode === 'generate' ? <Generator /> : <Scanner />}
    </section>
  )
}
