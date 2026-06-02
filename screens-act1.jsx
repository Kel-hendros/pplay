// Momento 0 (rol+tips), 1 (notif Rachel + dossier + transición), 2 (5 opciones)

function ScreenRol({ onNext, progress }) {
  const c = window.CONTENT.rol;
  return (
    <div className="pp-screen">
      <TopBar progress={progress} label={`M0 / 06`} />
      <div className="pp-body">
        <p className="eyebrow eyebrow-dot">Antes de empezar</p>
        <h1 className="display reveal">{c.title}</h1>
        {c.paragraphs.map((p, i) => (
          <p key={i} className={i === 0 ? "lede reveal" : "body reveal"} style={{ animationDelay: `${0.1 + i*0.08}s` }}>{p}</p>
        ))}
        <hr className="hr-soft" />
        <p className="eyebrow">{c.tipsTitle}</p>
        <p className="body" style={{ color: "var(--ink-2)" }}>{c.tipsIntro}</p>
        <ul className="tip-list">
          {c.tips.map(([t, d], i) => (
            <li key={i}><strong>{t}</strong>{d}</li>
          ))}
        </ul>
        <Btn primary block lg sticky onClick={onNext}>Empezar</Btn>
      </div>
    </div>
  );
}

function ScreenM1Notif({ onOpen, onBack, progress }) {
  const m = window.CONTENT.rachelMessage;
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setRevealed(r => r + 1 >= m.body.length ? r : r + 1);
    }, 700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="pp-screen" style={{ background: "var(--bg-2)" }}>
      <TopBar onBack={onBack} progress={progress} label="M1 / 06" />
      <div className="pp-body">
        <div className="notif reveal" style={{ marginBottom: 18 }}>
          <div className="notif-icon">R</div>
          <div style={{ flex: 1 }}>
            <div className="notif-meta"><span>Mensaje · Aethelgard</span><span>Ahora</span></div>
            <div className="notif-name">Rachel Voss · Chief of Staff</div>
            <div className="notif-body">“Necesito que leas esto antes de la reunión de las 9. Es urgente.”</div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: "3px solid var(--c-rachel)" }}>
          <div className="mono" style={{ marginBottom: 6 }}>De: Rachel Voss · Para: Ti</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 14 }}>{m.subject}</div>
          {m.body.slice(0, revealed + 1).map((p, i) => (
            <p key={i} className="body reveal" style={{ marginBottom: 12, color: i === m.body.length - 1 ? "var(--ink)" : "var(--ink-2)" }}>{p}</p>
          ))}
          {revealed < m.body.length - 1 && (
            <span className="dots"><span></span><span></span><span></span></span>
          )}
        </div>
        <Btn primary block lg sticky disabled={revealed < m.body.length - 1} onClick={onOpen}>
          Abrir Dossier
        </Btn>
      </div>
    </div>
  );
}

function ActorCard({ a }) {
  const tagLabel = a.tone === "risk" ? "Riesgo" : a.tone === "ally" ? "Aliado posible" : "Adversario";
  const tagColor = a.tone === "risk" ? "var(--c-sia)" : a.tone === "ally" ? "var(--c-harrison)" : "var(--c-thorne)";
  return (
    <div className="actor" style={{ "--accent-line": a.accent }}>
      <div className="actor-head">
        <div className="av-sq" style={{ background: a.accent + "22", color: a.accent, borderColor: a.accent + "55" }}>
          {a.name.split(" ").slice(-1)[0][0]}
        </div>
        <div style={{ flex: 1 }}>
          <div className="nm">{a.name}</div>
          <div className="rl">{a.role}</div>
          <span className="tag" style={{ color: tagColor }}>{tagLabel}</span>
        </div>
      </div>
      <ul className="bullets">
        {a.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      <dl className="kv">
        <dt>Quiere</dt><dd>{a.quiere}</dd>
        <dt>Peligro</dt><dd>{a.peligro}</dd>
      </dl>
    </div>
  );
}

function ScreenDossier({ onNext, onBack, progress }) {
  const d = window.CONTENT.dossier;
  return (
    <div className="pp-screen">
      <TopBar onBack={onBack} progress={progress} label="M1 / 06" />
      <div className="pp-body">
        <div className="dossier-head">
          <div className="seal">CONF<br/>1·01</div>
          <div>
            <div className="ttl">Dossier de crisis</div>
            <div className="sub">OFERTA HOSTIL · TITAN ENERGY · 48H</div>
          </div>
        </div>

        <div className="dossier-section">
          <h3>Situación</h3>
          {d.situacion.map((p, i) => <p key={i} className="body">{p}</p>)}
        </div>

        <div className="dossier-section">
          <h3>Actores clave</h3>
          {d.actores.map(a => <ActorCard key={a.name} a={a} />)}
        </div>

        <div className="dossier-section">
          <h3>Lo que tienes</h3>
          <div className="fc-grid">
            <div className="fc-col pos">
              <h4>A favor</h4>
              <ul>{d.favor.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
            <div className="fc-col neg">
              <h4>En contra</h4>
              <ul>{d.contra.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          </div>
        </div>

        <div className="dossier-section">
          <h3>Tu misión</h3>
          <p className="body">En 48 horas, la Junta Directiva vota. Tu trabajo es llegar a esa votación con la mejor posición posible. Hablar con la gente correcta. Entender qué quiere cada uno. Construir una propuesta que puedas defender.</p>
          <p className="body" style={{ color: "var(--ink)" }}>Nadie te va a decir qué hacer. Pero las decisiones que tomes — y cómo las tomes — van a definir el resultado.</p>
        </div>

        <Btn primary block lg sticky onClick={onNext}>Entendido. ¿Qué pasa ahora?</Btn>
      </div>
    </div>
  );
}

function ScreenTransition({ onNext, onBack, progress, content, label = "M1 / 06" }) {
  return (
    <div className="pp-screen" style={{ background: "var(--bg-2)" }}>
      <TopBar onBack={onBack} progress={progress} label={label} />
      <div className="pp-body">
        <div className="notif reveal" style={{ marginBottom: 22 }}>
          <div className="notif-icon">R</div>
          <div style={{ flex: 1 }}>
            <div className="notif-meta"><span>Rachel Voss</span><span>Recién</span></div>
            <div className="notif-body">{content.notif}</div>
          </div>
        </div>
        <p className="eyebrow">Narrador</p>
        <p className="lede" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20, color: "var(--ink)", whiteSpace: "pre-line" }}>{content.narrator}</p>
        <Btn primary block lg sticky onClick={onNext}>Ver opciones de respuesta</Btn>
      </div>
    </div>
  );
}

// ───── Momento 2: Choices ─────
function ScreenChoices({ onConfirm, onBack, progress }) {
  const m2 = window.CONTENT.m2;
  const [open, setOpen] = useState(null);
  const [picked, setPicked] = useState(null);
  const toggle = (id) => setOpen(o => o === id ? null : id);
  const chosen = m2.options.find(o => o.id === picked);
  return (
    <div className="pp-screen">
      <TopBar onBack={onBack} progress={progress} label="M2 / 06" />
      <div className="pp-body">
        <p className="eyebrow eyebrow-dot">Primera decisión</p>
        <h2 className="title">¿Cómo respondemos?</h2>
        <div className="card" style={{ borderLeft: "3px solid var(--c-rachel)", marginBottom: 18 }}>
          <div className="mono" style={{ color: "var(--c-rachel)", marginBottom: 4 }}>Rachel Voss</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-2)" }}>“{m2.intro}”</div>
        </div>

        {m2.options.map((o, i) => {
          const isOpen = open === o.id;
          const isPicked = picked === o.id;
          return (
            <div key={o.id} className={`choice ${isOpen ? "open" : ""} ${isPicked ? "selected" : ""}`}>
              <button className="choice-head" onClick={() => toggle(o.id)}>
                <span className="choice-num">0{i+1}</span>
                <span className="choice-titles">
                  <span className="t">{o.title}</span>
                  <span className="s">{o.sub}</span>
                </span>
                <span className="choice-chev">▾</span>
              </button>
              {isOpen && (
                <div className="choice-body">
                  <p>{o.body}</p>
                  <div className="choice-rachel">
                    <strong>Rachel</strong>
                    “{o.rachel}”
                  </div>
                  <div className="choice-pick">
                    <Btn ghost block onClick={() => toggle(o.id)}>Seguir explorando</Btn>
                    <Btn primary block onClick={() => { setPicked(o.id); setOpen(null); window.scrollTo(0, 0); }}>
                      {isPicked ? "Elegida" : "Elegir esta"}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {chosen && (
          <div className="card card-flat" style={{ marginTop: 18, borderLeft: "3px solid var(--accent)" }}>
            <div className="mono" style={{ color: "var(--accent)", marginBottom: 4 }}>Tu decisión</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 18 }}>{chosen.title}</div>
          </div>
        )}

        <Btn primary block lg sticky disabled={!picked} onClick={() => onConfirm(picked)}>
          {picked ? "Confirmar decisión" : "Elige una opción para continuar"}
        </Btn>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenRol, ScreenM1Notif, ScreenDossier, ScreenTransition, ScreenChoices });
