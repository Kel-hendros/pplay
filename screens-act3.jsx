// Momento 5 (votación) y Momento 6 (feedback coach IA)

function ScreenMonologue({ onDone, progress, ctx }) {
  const [phase, setPhase] = useState("intro"); // intro | speak | voting | result
  const [monologue, setMonologue] = useState("");
  const [voteResult, setVoteResult] = useState(null);
  const [voting, setVoting] = useState(false);

  const computeVote = async (mono) => {
    setVoting(true);
    setPhase("voting");
    // Use Claude to produce coherent vote lines
    const prompt = `Sos el motor narrativo de un juego de Drama Theory. Devolvé SOLO un JSON con votos del Board de Aethelgard.

Estado del juego:
- Decisión M2 (estrategia mediática): ${ctx.decision_m2}
- Resultado conversación con Sia: ${ctx.sia_result}
- Resumen Sia: ${ctx.sia_summary}
- Resultado conversación con Harrison: ${ctx.harrison_result}
- Resumen Harrison: ${ctx.harrison_summary}
- Monólogo final del jugador (puede estar vacío): "${mono || "(no habló)"}"

Devolvé:
{
  "outcome": "rechazada" | "aceptada",
  "sia_vote": "no" | "yes" | "abs",
  "sia_line": "1 oración en estilo de Sia (cansada, directa) explicando su voto",
  "harrison_vote": "no" | "yes",
  "harrison_line": "1 oración en estilo de Lord Harrison (formal, mesurado) explicando su voto",
  "narration": "1 párrafo (3 oraciones) cerrando dramáticamente el resultado en tercera persona",
  "monologue_effect": "1 oración: ¿el monólogo movió algo? Si fue vacío decir que pasó directo a votación."
}

JSON:`;
    let parsed = null;
    try {
      const raw = await window.claude.complete(prompt);
      const txt = typeof raw === "string" ? raw : raw.content;
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch (e) { console.error(e); }
    if (!parsed) {
      parsed = {
        outcome: "rechazada",
        sia_vote: "no", sia_line: "Voto no.",
        harrison_vote: "no", harrison_line: "Voto no.",
        narration: "El Board vota.",
        monologue_effect: "—",
      };
    }
    setVoteResult(parsed);
    setVoting(false);
    setPhase("result");
  };

  if (phase === "intro") {
    return (
      <div className="pp-screen">
        <StatusBar />
        <TopBar progress={progress} label="M5 / 06" />
        <div className="pp-body">
          <p className="eyebrow eyebrow-dot">Momento de verdad</p>
          <h2 className="title">La sala del Board</h2>
          <p className="lede" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 19 }}>Séptimo piso. Vista al río. Alrededor de la mesa están los miembros del Board. Lord Harrison en la cabecera, las manos cruzadas. A su lado los demás directores — pero todos en la sala saben que cuando Harrison se decida, los demás lo van a seguir.</p>
          <p className="lede" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 19 }}>Sia no está. Pero todos saben lo que pasó — o lo que creen que pasó.</p>
          <p className="body" style={{ marginTop: 18, color: "var(--ink)" }}>Harrison te mira. <em style={{ color: "var(--accent)", fontStyle: "normal" }}>“Antes de votar, ¿querés decir algo?”</em></p>
          <Btn primary block lg sticky onClick={() => setPhase("speak")}>Tomar la palabra</Btn>
        </div>
      </div>
    );
  }

  if (phase === "speak") {
    return (
      <div className="pp-screen">
        <StatusBar />
        <TopBar progress={progress} label="M5 / 06" />
        <div className="pp-body">
          <p className="eyebrow">Tus últimas palabras</p>
          <h2 className="title">Tenés un minuto.<br/><em style={{ fontStyle: "italic", color: "var(--accent)" }}>Hacelo contar.</em></h2>
          <textarea
            value={monologue}
            onChange={e => setMonologue(e.target.value)}
            placeholder="Lo que digas acá puede reforzar — o contradecir — lo que ya construiste."
            style={{
              width: "100%", minHeight: 220, padding: 16, marginTop: 8,
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 14, color: "var(--ink)", fontSize: 15.5, lineHeight: 1.55,
              fontFamily: "var(--serif)", outline: "none", resize: "none",
            }}
          />
          <Btn primary block lg style={{ marginTop: 14 }} onClick={() => computeVote(monologue)}>
            Tomar la palabra y pasar a votación
          </Btn>
          <button onClick={() => computeVote("")} style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 12, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 14, width: "100%", textAlign: "center" }}>
            Pasar a votación sin hablar
          </button>
        </div>
      </div>
    );
  }

  if (phase === "voting" || voting) {
    return (
      <div className="pp-screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <StatusBar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
          <span className="dots"><span></span><span></span><span></span></span>
          <p className="eyebrow" style={{ marginTop: 18 }}>El Board delibera</p>
          <h2 className="title" style={{ fontSize: 24 }}>Se está votando…</h2>
        </div>
      </div>
    );
  }

  // result
  const r = voteResult;
  const badgeFor = (v) => v === "no" ? "no" : v === "yes" ? "yes" : "abs";
  const labelFor = (v) => v === "no" ? "VOTA NO" : v === "yes" ? "VOTA SÍ" : "ABSTIENE";
  return (
    <div className="pp-screen">
      <StatusBar />
      <TopBar progress={progress} label="M5 / 06" />
      <div className="pp-body">
        <p className="eyebrow eyebrow-dot">Resultado</p>
        <h2 className="title">{r.outcome === "rechazada" ? "Oferta rechazada." : "Oferta aceptada."}</h2>
        <p className="lede" style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>{r.narration}</p>

        <div className="divider">Cómo votó cada uno</div>
        <div className="vote-row">
          <div className="av" style={{ background: "var(--c-sia)22", color: "var(--c-sia)", borderColor: "var(--c-sia)55" }}>K</div>
          <div>
            <div className="nm">Sia Kapoor</div>
            <div className="rl">Fundadora · accionista</div>
            <div className="qt">“{r.sia_line}”</div>
          </div>
          <div className={`vote-badge ${badgeFor(r.sia_vote)}`}>{labelFor(r.sia_vote)}</div>
        </div>
        <div className="vote-row">
          <div className="av" style={{ background: "var(--c-harrison)22", color: "var(--c-harrison)", borderColor: "var(--c-harrison)55" }}>H</div>
          <div>
            <div className="nm">Lord Harrison</div>
            <div className="rl">Presidente · voto decisivo</div>
            <div className="qt">“{r.harrison_line}”</div>
          </div>
          <div className={`vote-badge ${badgeFor(r.harrison_vote)}`}>{labelFor(r.harrison_vote)}</div>
        </div>
        <div className="vote-row">
          <div className="av">B</div>
          <div>
            <div className="nm">Resto del Board</div>
            <div className="rl">4 directores</div>
            <div className="qt">Acompañan el voto de Harrison.</div>
          </div>
          <div className={`vote-badge ${badgeFor(r.harrison_vote)}`}>SIGUEN</div>
        </div>

        {monologue && (
          <div className="card card-flat" style={{ marginTop: 22, borderLeft: "3px solid var(--accent)" }}>
            <div className="mono" style={{ color: "var(--accent)", marginBottom: 4 }}>El efecto de tu monólogo</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{r.monologue_effect}</div>
          </div>
        )}

        <Btn primary block lg sticky onClick={() => onDone({ ...r, monologue })}>Recibir feedback del coach</Btn>
      </div>
    </div>
  );
}

// ───── Momento 6: Coach feedback (structured analysis report) ─────
// NOT a chat. This is a post-game evaluation page: Marina analyzes the run
// once, returns a structured report, and the player reads it. We render it as
// a series of section cards, not chat bubbles.
const COACH_SYSTEM = `Sos "Marina", coach senior de power skills de Perspective Play. La ficción terminó. El jugador (un/a CEO interino/a de Aethelgard, 5+ años en la empresa) acaba de salir de una crisis simulada y vino a ver tu análisis.

Hablás español rioplatense en tuteo. Profesional, directa, con autoridad académica. No sos un coach blando ni una NPC en personaje — sos una analista que evalúa con rigor.

TU TAREA:
Devolver UN JSON con tu análisis, fundamentado en Game Theory (Schelling, Myerson, info asimétrica, focal points, signaling) y Drama Theory (Bryant: dilemas de confianza, persuasión).

REGLAS:
- Densidad sobre extensión. Cada campo es CORTO pero filoso.
- Citás autores por nombre cuando aplica ("Schelling lo llama focal point", "Bryant: dilema de confianza").
- Citás la decisión ESPECÍFICA del jugador, no genérico.
- Tenés opinión. Si la cagó, lo decís sin maquillarlo. Si la rompió, lo nombrás. Nada de "excelente reflexión" vacío.
- NUNCA inventes hechos. Solo lo que está en el contexto.
- Sin acotaciones teatrales, sin saludos.

FORMATO (JSON estricto, SIN markdown, SIN \`\`\`). LÍMITES DE LONGITUD ESTRICTOS:

{
  "verdict": "Una oración contundente, 10-15 palabras max.",
  "score_label": "2-3 palabras: 'Competente', 'Necesita trabajo', 'Excepcional', etc.",
  "summary": "1 párrafo, máximo 3 oraciones. Resultado + patrón observado.",
  "sections": [
    {
      "title": "Estrategia mediática (M2)",
      "frameworks": ["Schelling: focal points", "Signaling"],
      "body": "Máximo 3 oraciones. Citá la decisión exacta, decí qué hizo bien o mal y por qué con el concepto."
    },
    {
      "title": "Conversación con Sia (M3)",
      "frameworks": ["Información asimétrica"],
      "body": "Máximo 3 oraciones."
    },
    {
      "title": "Conversación con Harrison (M4)",
      "frameworks": ["Bryant: dilema de confianza"],
      "body": "Máximo 3 oraciones."
    },
    {
      "title": "Voto y cierre (M5)",
      "frameworks": ["Credibilidad de compromisos"],
      "body": "Máximo 2 oraciones."
    }
  ],
  "takeaways": [
    "1 oración densa y accionable, citando concepto.",
    "1 oración.",
    "1 oración."
  ]
}

Devolvé SOLO el JSON. Sin texto antes ni después.`;

function ScreenFeedback({ ctx, onDone, progress }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const buildContextMsg = () => `CONTEXTO DEL RUN:
- Decisión mediática (M2): ${ctx.decision_m2}
- Resultado con Sia: ${ctx.sia_result}
  Resumen: ${ctx.sia_summary}
- Resultado con Harrison: ${ctx.harrison_result}
  Resumen: ${ctx.harrison_summary}
- Monólogo final del jugador: ${ctx.monologue || "(no habló)"}
- Resultado de la votación: ${ctx.outcome}
- Cómo votó Sia: ${ctx.sia_vote} ("${ctx.sia_line}")
- Cómo votó Harrison: ${ctx.harrison_vote} ("${ctx.harrison_line}")

Devolvé el JSON con tu análisis.`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await window.claude.complete({
          system: COACH_SYSTEM,
          messages: [{ role: "user", content: buildContextMsg() }],
        });
        const txt = typeof raw === "string" ? raw : raw.content;
        // Greedy match for the outermost JSON object
        const match = txt.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("respuesta sin JSON");
        let parsed;
        try {
          parsed = JSON.parse(match[0]);
        } catch (parseErr) {
          // Truncated JSON — try to salvage by closing brackets
          let salvage = match[0];
          // Strip incomplete trailing string/object/array
          const opens = (salvage.match(/\{/g) || []).length;
          const closes = (salvage.match(/\}/g) || []).length;
          const arrOpens = (salvage.match(/\[/g) || []).length;
          const arrCloses = (salvage.match(/\]/g) || []).length;
          // Cut at last comma or quote-close before truncation point
          const lastSafe = Math.max(salvage.lastIndexOf('",'), salvage.lastIndexOf('"]'), salvage.lastIndexOf('"}'));
          if (lastSafe > 0) salvage = salvage.slice(0, lastSafe + 1);
          // Re-balance brackets
          for (let i = 0; i < arrOpens - arrCloses; i++) salvage += "]";
          for (let i = 0; i < opens - closes; i++) salvage += "}";
          parsed = JSON.parse(salvage);
        }
        if (!cancelled) setReport(parsed);
      } catch (e) {
        console.error("Feedback gen failed:", e?.message || e);
        if (!cancelled) setError(e?.message || "error");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  return (
    <div className="pp-screen">
      <StatusBar />
      <TopBar progress={progress} label="M6 / 06" />
      <div className="pp-body">
        <p className="eyebrow eyebrow-dot">Análisis del run</p>

        {loading && (
          <div className="report-loading">
            <div className="report-loading-shimmer">
              <div className="shim" style={{ width: "60%" }} />
              <div className="shim" style={{ width: "85%" }} />
              <div className="shim" style={{ width: "75%" }} />
            </div>
            <div className="mono" style={{ marginTop: 18, color: "var(--ink-3)" }}>
              <span className="dots"><span></span><span></span><span></span></span>
              &nbsp;Marina está revisando tu run…
            </div>
          </div>
        )}

        {error && !loading && (
          <>
            <div className="card" style={{ borderLeft: "3px solid var(--c-rachel)" }}>
              <div className="mono" style={{ color: "var(--c-rachel)", marginBottom: 6 }}>Error</div>
              <div className="body">No pude generar el análisis. Probá de nuevo.</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn primary block lg onClick={() => setAttempt(a => a + 1)}>Reintentar</Btn>
              <Btn ghost block lg onClick={() => onDone(ctx)}>Saltar</Btn>
            </div>
          </>
        )}

        {report && !loading && (
          <>
            <div className="report-head">
              <div className="report-coach">
                <div className="av-l" style={{ background: "var(--accent)22", color: "var(--accent)", borderColor: "var(--accent)55" }}>M</div>
                <div>
                  <div className="nm">Marina</div>
                  <div className="rl">Coach · Game Theory · Drama Theory</div>
                </div>
              </div>
              {report.score_label && (
                <div className="report-tag">{report.score_label}</div>
              )}
            </div>

            {report.verdict && (
              <h2 className="report-verdict">{report.verdict}</h2>
            )}

            {report.summary && (
              <p className="report-summary">{report.summary}</p>
            )}

            {Array.isArray(report.sections) && report.sections.map((s, i) => (
              <div className="report-section" key={i}>
                <div className="report-section-num">0{i + 1}</div>
                <h3 className="report-section-title">{s.title}</h3>
                {Array.isArray(s.frameworks) && s.frameworks.length > 0 && (
                  <div className="report-frameworks">
                    {s.frameworks.map((f, j) => <span key={j} className="report-fw">{f}</span>)}
                  </div>
                )}
                <p className="report-section-body">{s.body}</p>
              </div>
            ))}

            {Array.isArray(report.takeaways) && report.takeaways.length > 0 && (
              <div className="report-takeaways">
                <div className="report-takeaways-label">Para llevarte</div>
                <ol>
                  {report.takeaways.map((t, i) => <li key={i}>{t}</li>)}
                </ol>
              </div>
            )}

            <Btn primary block lg sticky onClick={() => onDone(ctx)}>
              Cerrar capítulo · ver mi progreso
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenMonologue, ScreenFeedback });
