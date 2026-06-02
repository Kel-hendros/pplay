// actor-inspector.jsx
// Read-only backoffice for inspecting actor "parameters" (system prompts +
// dossier data). Reached via a discreet button + password.
//
// SECURITY NOTE: this is a STATIC front-end app. The password below is a SOFT
// GATE — it keeps casual players out, but anyone with DevTools can read the
// source (which already contains every prompt) and this constant. It is NOT
// real access control. If you need the prompts genuinely hidden, they have to
// live server-side (Supabase / the edge function), not here.
const BACKOFFICE_PASSWORD = "aethelgard";

const __AOI_STYLE = `
  .aoi-fab{position:fixed;left:14px;bottom:14px;z-index:2147483645;
    width:28px;height:28px;border-radius:50%;border:1px solid var(--line);
    background:var(--surface);color:var(--ink-3);font-size:13px;line-height:1;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
    opacity:.35;transition:opacity .15s,color .15s,border-color .15s}
  .aoi-fab:hover{opacity:1;color:var(--ink);border-color:var(--ink-4)}
  /* Blue↔violet glass palette, scoped to the backoffice modal.
     Tweak these to retune the whole look. */
  .aoi-overlay{position:fixed;inset:0;z-index:2147483646;
    background:
      radial-gradient(60% 50% at 24% 14%, rgba(72,92,232,.34), transparent 60%),
      radial-gradient(58% 55% at 82% 86%, rgba(152,86,226,.30), transparent 62%),
      rgba(8,9,24,.60);
    -webkit-backdrop-filter:blur(9px) saturate(125%);backdrop-filter:blur(9px) saturate(125%);
    display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
  .aoi-modal{width:92vw;max-width:1100px;
    max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px);
    display:flex;flex-direction:column;
    background:
      radial-gradient(130% 90% at 0% 0%, rgba(80,100,228,.30), transparent 55%),
      radial-gradient(130% 95% at 100% 100%, rgba(152,92,226,.28), transparent 55%),
      rgba(24,26,54,.66);
    -webkit-backdrop-filter:blur(26px) saturate(150%);backdrop-filter:blur(26px) saturate(150%);
    border:1px solid rgba(168,176,255,.22);border-radius:18px;overflow:hidden;
    box-shadow:0 24px 70px rgba(18,10,52,.55),inset 0 1px 0 rgba(255,255,255,.07);
    font-family:var(--sans);color:#ece9fb}
  .aoi-hd{display:flex;align-items:center;justify-content:space-between;
    padding:16px 18px;border-bottom:1px solid rgba(168,176,255,.14);flex-shrink:0}
  .aoi-hd-t{font-size:13px;font-weight:600;letter-spacing:.01em}
  .aoi-hd-s{font-family:var(--mono);font-size:10px;letter-spacing:.08em;
    text-transform:uppercase;color:#928ec0;margin-top:2px}
  .aoi-x{appearance:none;border:0;background:transparent;color:#928ec0;
    width:26px;height:26px;border-radius:7px;cursor:pointer;font-size:15px}
  .aoi-x:hover{background:rgba(150,160,255,.14);color:#ece9fb}
  .aoi-body{padding:18px;flex:1 1 auto;min-height:0;-webkit-overflow-scrolling:touch;
    overflow-y:auto;display:flex;flex-direction:column;gap:14px}

  .aoi-gate{padding:26px 22px;display:flex;flex-direction:column;gap:12px}
  .aoi-gate p{font-size:13px;color:#c4c1e2;line-height:1.5;margin:0}
  .aoi-gate .warn{font-size:11.5px;color:#928ec0}
  .aoi-input{height:38px;padding:0 12px;border:1px solid rgba(168,176,255,.22);border-radius:9px;
    background:rgba(124,132,235,.10);color:#ece9fb;font:inherit;font-size:14px;outline:none}
  .aoi-input:focus{border-color:rgba(170,178,255,.50);background:rgba(124,132,235,.16)}
  .aoi-input.err{border-color:#e58aa6}
  .aoi-go{height:38px;border:0;border-radius:9px;
    background:linear-gradient(135deg,#6072ff,#a06bff);
    color:#fff;font:inherit;font-weight:600;font-size:13px;cursor:pointer}
  .aoi-go:hover{background:linear-gradient(135deg,#7180ff,#ad7cff)}
  .aoi-err{font-size:12px;color:#f0a0b6}

  .aoi-card{border:1px solid rgba(168,176,255,.14);border-radius:12px;
    background:rgba(124,132,235,.06);overflow:hidden}
  .aoi-card-hd{display:flex;align-items:center;gap:10px;padding:13px 15px;
    border-bottom:1px solid rgba(168,176,255,.10)}
  .aoi-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;
    box-shadow:0 0 10px currentColor}
  .aoi-card-nm{font-size:14px;font-weight:600}
  .aoi-card-rl{font-size:11.5px;color:#928ec0;margin-top:1px}
  .aoi-card-bd{padding:13px 15px;display:flex;flex-direction:column;gap:12px}
  .aoi-field-lbl{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;
    text-transform:uppercase;color:#8f8bc4;margin-bottom:5px}
  .aoi-field-val{font-size:13px;line-height:1.5;color:#c4c1e2}
  .aoi-list{margin:0;padding-left:16px;display:flex;flex-direction:column;gap:4px}
  .aoi-list li{font-size:13px;line-height:1.45;color:#c4c1e2}
  .aoi-chips{display:flex;flex-wrap:wrap;gap:6px}
  .aoi-chip{font-family:var(--mono);font-size:10.5px;padding:3px 8px;border-radius:6px;
    background:rgba(124,132,235,.13);border:1px solid rgba(168,176,255,.18);color:#c4c1e2}
  .aoi-note{font-size:11.5px;color:#928ec0;font-style:italic;line-height:1.45}

  .aoi-details{border:1px solid rgba(168,176,255,.16);border-radius:9px;
    background:rgba(14,15,38,.38)}
  .aoi-details>summary{cursor:pointer;list-style:none;padding:10px 13px;
    font-family:var(--mono);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;
    color:#8f8bc4;display:flex;align-items:center;justify-content:space-between}
  .aoi-details>summary::-webkit-details-marker{display:none}
  .aoi-details>summary:hover{color:#ece9fb}
  .aoi-copy{font-family:var(--mono);font-size:10px;border:1px solid rgba(168,176,255,.18);
    background:rgba(124,132,235,.10);color:#928ec0;border-radius:6px;padding:3px 7px;cursor:pointer}
  .aoi-copy:hover{color:#ece9fb;border-color:rgba(170,178,255,.38)}
  .aoi-pre{margin:0;padding:0 13px 13px;font-family:var(--mono);font-size:11px;
    line-height:1.55;color:#c4c1e2;white-space:pre-wrap;word-break:break-word}
`;

// Links each dossier actor to its runtime prompt + brief + result schema.
function aoiActorMeta() {
  return {
    "Dra. Sia Kapoor": {
      color: "var(--c-sia)",
      systemPrompt: window.SIA_SYSTEM,
      brief: window.CONTENT?.briefs?.sia,
      resultOptions: ["se_queda", "se_queda_condicional", "ambiguo", "se_va"],
    },
    "Lord Edmund Harrison": {
      color: "var(--c-harrison)",
      systemPrompt: window.HARRISON_SYSTEM_BASE,
      brief: window.CONTENT?.briefs?.harrison,
      resultOptions: ["vota_no", "vota_no_condicional", "indeciso", "vota_si"],
      note: "El prompt final se modula en runtime según el resultado con Sia (ver harrisonSystem en screens-npcs.jsx).",
    },
    "Marcus Thorne": {
      color: "var(--c-thorne)",
      systemPrompt: null,
      note: "No tiene chat ni system prompt: existe solo como fuerza antagónica en el dossier.",
    },
  };
}

function AoiCopyButton({ text }) {
  const [done, setDone] = React.useState(false);
  if (!text) return null;
  return (
    <button className="aoi-copy" onClick={(e) => {
      e.preventDefault();
      navigator.clipboard?.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    }}>{done ? "copiado ✓" : "copiar"}</button>
  );
}

function AoiPrompt({ label, text, note }) {
  if (!text) {
    return note ? <div className="aoi-note">{note}</div> : null;
  }
  return (
    <>
      {note && <div className="aoi-note">{note}</div>}
      <details className="aoi-details">
        <summary>
          <span>{label} · {text.length.toLocaleString()} chars</span>
          <AoiCopyButton text={text} />
        </summary>
        <pre className="aoi-pre">{text}</pre>
      </details>
    </>
  );
}

function AoiActorCard({ actor, meta }) {
  return (
    <div className="aoi-card">
      <div className="aoi-card-hd">
        <span className="aoi-dot" style={{ background: meta.color }} />
        <div>
          <div className="aoi-card-nm">{actor.name}</div>
          <div className="aoi-card-rl">{actor.role}</div>
        </div>
      </div>
      <div className="aoi-card-bd">
        {actor.bullets?.length > 0 && (
          <div>
            <div className="aoi-field-lbl">Rasgos</div>
            <ul className="aoi-list">{actor.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
          </div>
        )}
        {actor.quiere && (
          <div>
            <div className="aoi-field-lbl">Qué quiere</div>
            <div className="aoi-field-val">{actor.quiere}</div>
          </div>
        )}
        {actor.peligro && (
          <div>
            <div className="aoi-field-lbl">Peligro</div>
            <div className="aoi-field-val">{actor.peligro}</div>
          </div>
        )}
        {meta.resultOptions && (
          <div>
            <div className="aoi-field-lbl">Resultados posibles (clasificador)</div>
            <div className="aoi-chips">
              {meta.resultOptions.map((o) => <span key={o} className="aoi-chip">{o}</span>)}
            </div>
          </div>
        )}
        {meta.brief && (
          <div>
            <div className="aoi-field-lbl">Brief del equipo · {meta.brief.analyst}</div>
            <ul className="aoi-list">{meta.brief.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
        )}
        <AoiPrompt label="System prompt" text={meta.systemPrompt} note={meta.note} />
      </div>
    </div>
  );
}

function ActorInspector() {
  const [open, setOpen] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(
    () => sessionStorage.getItem("aoi_unlocked") === "1"
  );
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState(false);

  const close = () => { setOpen(false); setPw(""); setErr(false); };
  const submit = (e) => {
    e?.preventDefault();
    if (pw === BACKOFFICE_PASSWORD) {
      setUnlocked(true);
      sessionStorage.setItem("aoi_unlocked", "1");
      setErr(false);
    } else {
      setErr(true);
    }
  };

  const actores = window.CONTENT?.dossier?.actores || [];
  const meta = aoiActorMeta();

  return (
    <>
      <style>{__AOI_STYLE}</style>
      <button className="aoi-fab" title="Backoffice" aria-label="Backoffice"
              onClick={() => setOpen(true)}>◍</button>

      {open && (
        <div className="aoi-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="aoi-modal">
            <div className="aoi-hd">
              <div>
                <div className="aoi-hd-t">Backoffice · Parámetros de actores</div>
                <div className="aoi-hd-s">{window.CONTENT?.meta?.chapter || "Aethelgard"} · solo lectura</div>
              </div>
              <button className="aoi-x" onClick={close} aria-label="Cerrar">✕</button>
            </div>

            {!unlocked ? (
              <form className="aoi-gate" onSubmit={submit}>
                <p>Ingresá la contraseña para ver los parámetros de los actores.</p>
                <input
                  className={err ? "aoi-input err" : "aoi-input"}
                  type="password" autoFocus value={pw}
                  placeholder="Contraseña"
                  onChange={(e) => { setPw(e.target.value); setErr(false); }}
                />
                {err && <div className="aoi-err">Contraseña incorrecta.</div>}
                <button className="aoi-go" type="submit">Entrar</button>
                <p className="warn">Nota: es un gate visual. Los prompts viajan al browser igual.</p>
              </form>
            ) : (
              <div className="aoi-body">
                <AoiPrompt label="Contexto del jugador (compartido por todos los NPCs)"
                           text={window.PLAYER_CONTEXT} />
                {actores.map((a) => (
                  <AoiActorCard key={a.name} actor={a} meta={meta[a.name] || {}} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

window.ActorInspector = ActorInspector;
