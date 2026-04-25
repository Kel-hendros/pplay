import "@supabase/functions-js/edge-runtime.d.ts"

// ─── Server-side guardrails ──────────────────────────────────────────────────
// These caps protect the OpenAI key from runaway costs even if the anon key
// leaks. The client cannot lift these.
const ALLOWED_MODELS = new Set([
  'gpt-4',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
])
const DEFAULT_MODEL = 'gpt-4'
const MAX_TOKENS_CAP = 1024
const MAX_MESSAGES = 60
const MAX_CHARS_PER_MESSAGE = 8000

// Origin allowlist. By default only trusted local/dev origins; in production set
// the ALLOWED_ORIGINS secret to a comma-separated list (e.g.
// "https://demo.perspectiveplay.com,https://kelhendros.github.io").
// The literal "null" matches requests from file:// pages.
const DEFAULT_ALLOWED_ORIGINS = [
  'null',
  'http://localhost',
  'http://127.0.0.1',
]

function buildAllowedOrigins(): string[] {
  const fromEnv = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...DEFAULT_ALLOWED_ORIGINS, ...fromEnv]
}

function isOriginAllowed(origin: string | null, allowed: string[]): boolean {
  if (!origin) return true // same-origin / non-browser callers
  return allowed.some((entry) => {
    if (entry === origin) return true
    // localhost + any port
    if (entry === 'http://localhost' && /^http:\/\/localhost(?::\d+)?$/.test(origin)) return true
    if (entry === 'http://127.0.0.1' && /^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin)) return true
    return false
  })
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  // Echo the request origin if allowed, otherwise omit the header so the
  // browser blocks the response.
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const allowedOrigins = buildAllowedOrigins()
  const originOk = isOriginAllowed(origin, allowedOrigins)
  const cors = corsHeadersFor(originOk ? origin : null)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  if (!originOk) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const body = await req.json()
    const { messages, system, model, temperature, max_tokens } = body

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required')
    }

    if (messages.length > MAX_MESSAGES) {
      throw new Error(`Too many messages (max ${MAX_MESSAGES})`)
    }

    for (const m of messages) {
      if (typeof m?.content !== 'string') continue
      if (m.content.length > MAX_CHARS_PER_MESSAGE) {
        throw new Error(`Message exceeds ${MAX_CHARS_PER_MESSAGE} characters`)
      }
    }

    const requestedModel = typeof model === 'string' ? model : DEFAULT_MODEL
    const finalModel = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL

    const requestedTokens = typeof max_tokens === 'number' ? max_tokens : 500
    const finalMaxTokens = Math.min(Math.max(1, Math.floor(requestedTokens)), MAX_TOKENS_CAP)

    const finalTemperature = typeof temperature === 'number'
      ? Math.min(Math.max(0, temperature), 2)
      : 0.8

    const finalMessages = system
      ? [{ role: 'system', content: String(system).slice(0, MAX_CHARS_PER_MESSAGE * 2) }, ...messages]
      : messages

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: finalModel,
        messages: finalMessages,
        temperature: finalTemperature,
        max_tokens: finalMaxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
