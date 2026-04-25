// Auth + Home + Onboarding screens

function ScreenAuth({ onAuth }) {
  const [mode, setMode] = useState("welcome"); // welcome | signup
  if (mode === "welcome") {
    return (
      <div className="pp-screen bg-grain">
        <StatusBar />
        <div className="pp-body" style={{ paddingTop: 60, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100%" }}>
          <p className="eyebrow eyebrow-dot">Power Plays · v0.1</p>
          <h1 className="display">No estudies negociación.<br/><em>Negociá.</em></h1>
          <p className="lede">Entrá a una crisis real, hablá con personas reales (servidas por IA), y descubrí cómo negociás bajo presión. Cada partida termina con un análisis fundamentado en Teoría de Juegos.</p>

          <div className="card card-flat" style={{ marginTop: 24 }}>
            <div className="mono" style={{ marginBottom: 6 }}>Capítulo piloto</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 20, lineHeight: 1.1, marginBottom: 4 }}>Aethelgard — La oferta hostil</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>20–25 min · 1 decisión · 2 conversaciones · Game Theory</div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn primary block lg onClick={() => setMode("signup")}>Crear cuenta</Btn>
            <Btn ghost block onClick={() => onAuth({ name: "Demo Player", email: "demo@power.play" })}>Tengo cuenta</Btn>
          </div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-3)", textAlign: "center", marginTop: 18, textTransform: "uppercase" }}>
            Aval académico · Game Theory · Drama Theory
          </p>
        </div>
      </div>
    );
  }

  // signup
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="pp-screen bg-grain">
      <StatusBar />
      <TopBar onBack={() => setMode("welcome")} progress={0} totalSegments={1} label="Crear cuenta" />
      <div className="pp-body" style={{ position: "relative", zIndex: 1 }}>
        <h2 className="title">Empezá a jugar</h2>
        <p className="body">Sin tarjeta, sin compromiso. El piloto es libre para los primeros testers.</p>
        <div className="field">
          <label>Tu nombre</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Cómo te dicen" />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="vos@trabajo.com" type="email" />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" placeholder="••••••••" />
        </div>
        <Btn primary block lg style={{ marginTop: 12 }} onClick={() => onAuth({ name: name || "Player", email: email || "demo@power.play" })}>Crear cuenta y empezar</Btn>
        <p className="mono" style={{ textAlign: "center", marginTop: 18 }}>SSO · Google · Microsoft · Apple</p>
      </div>
    </div>
  );
}

function ScreenHome({ user, profile, onPlay, onProfile }) {
  const completed = profile.chapterStatus === "done";
  const inProgress = profile.chapterStatus === "in_progress";
  return (
    <div className="pp-screen">
      <StatusBar />
      <div className="pp-topbar" style={{ borderBottom: "none" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="mono">Hola</span>
          <span style={{ fontFamily: "var(--serif)", fontSize: 22 }}>{user.name}</span>
        </div>
        <button onClick={onProfile} style={{ background: "none", border: "1px solid var(--line)", borderRadius: 999, padding: "6px 14px", color: "var(--ink)", fontSize: 12, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>
          Perfil · {profile.totalPoints}
        </button>
      </div>

      <div className="pp-body" style={{ paddingTop: 6 }}>
        <p className="eyebrow eyebrow-dot">Capítulo activo</p>
        <div className="hero-card">
          <span className="hero-tag">Power Plays · S01·E01</span>
          <div className="ttl">Aethelgard:<br/><em style={{ fontStyle: "italic", color: "var(--accent)" }}>la oferta hostil</em></div>
          <div className="sb">Sos el CEO interino de una empresa de fusión. En 48 horas, la Junta vota. Tenés que llegar preparado.</div>
          <div className="hero-meta">
            <span><strong>20–25</strong> min</span>
            <span><strong>2</strong> NPCs</span>
            <span>Game Theory</span>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
            <Btn primary block lg onClick={onPlay}>
              {completed ? "Volver a jugar" : inProgress ? "Continuar" : "Empezar capítulo"}
            </Btn>
          </div>
        </div>

        <div className="divider">El framework</div>
        <div className="card card-tight" style={{ marginBottom: 10 }}>
          <div className="mono" style={{ color: "var(--accent)" }}>Game Theory</div>
          <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.4 }}>Información asimétrica · Diseño de mecanismos · Credibilidad de compromisos</div>
        </div>
        <div className="card card-tight">
          <div className="mono" style={{ color: "var(--accent)" }}>Drama Theory · Bryant</div>
          <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.4 }}>Dilemas de confianza · Escalada · Ampliación de la arena</div>
        </div>

        <div className="divider">Tu progreso</div>
        {profile.skills.map(s => (
          <div className="skill" key={s.name}>
            <div className="skill-row">
              <div className="skill-meta">{s.tier}</div>
              <div className="skill-name">{s.name}</div>
              <div className="skill-bar"><span style={{ width: `${(s.points / s.max) * 100}%` }} /></div>
            </div>
            <div className="skill-pts">{s.points}</div>
          </div>
        ))}

        {completed && (
          <>
            <div className="divider">Capítulos</div>
            <div className="card card-tight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aethelgard — Cap. 1</div>
                <div className="mono" style={{ marginTop: 4 }}>Última run · {profile.lastRun}</div>
              </div>
              <div className="stars">
                {[1,2,3].map(i => <span key={i} className={`star ${i <= profile.stars ? "" : "empty"}`}>★</span>)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenAuth, ScreenHome });
