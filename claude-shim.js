// claude-shim.js
// Mapea window.claude.complete (API esperada por el prototipo de Claude Design)
// al edge function openai-proxy de Supabase del proyecto.
//
// Soporta dos formas de invocación:
//   window.claude.complete("prompt como string")
//   window.claude.complete({ system, messages: [{role, content}, ...] })
//
// Devuelve siempre un objeto { content: string }. Los callers del prototipo
// manejan tanto string como { content }.

(function () {
  const SUPABASE_URL = 'https://idkmyquqqedjhwsemjwh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlka215cXVxcWVkamh3c2VtandoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTE5MDMsImV4cCI6MjA4NTc4NzkwM30.pF1XJgUQx7tcCjTIVAy5fRcqRbHr-TS9ixBrZWLJ-F0';
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/openai-proxy`;

  async function complete(arg) {
    let payload;
    if (typeof arg === 'string') {
      payload = {
        messages: [{ role: 'user', content: arg }],
        max_tokens: 1024,
        temperature: 0.7,
      };
    } else if (arg && typeof arg === 'object') {
      payload = {
        system: arg.system,
        messages: Array.isArray(arg.messages) ? arg.messages : [],
        max_tokens: arg.max_tokens || 1024,
        temperature: typeof arg.temperature === 'number' ? arg.temperature : 0.8,
        model: arg.model,
      };
    } else {
      throw new Error('claude.complete: expected string or { system, messages }');
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).error || ''; } catch (_) {}
      throw new Error(`openai-proxy ${res.status}: ${detail || res.statusText}`);
    }

    const data = await res.json();
    return { content: data.content };
  }

  window.claude = { complete };
})();
