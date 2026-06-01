// Main app — orchestrates the full flow.

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "theme": "dark",
    "fastMode": false
  }/*EDITMODE-END*/);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks.theme]);

  const [step, setStep] = useState("auth"); // auth | home | m0..m6 | done
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    chapterStatus: "not_started",
    totalPoints: 0,
    stars: 0,
    lastRun: "—",
    skills: [
      { name: "Negociación bajo presión", tier: "Novice", points: 0, max: 200 },
      { name: "Lectura de stakeholders", tier: "Novice", points: 0, max: 200 },
      { name: "Pensamiento estratégico", tier: "Novice", points: 0, max: 200 },
    ],
  });
  const [run, setRun] = useState({
    decision_m2: null,
    sia_result: null, sia_summary: "",
    harrison_result: null, harrison_summary: "",
    outcome: null, sia_vote: null, harrison_vote: null,
    sia_line: "", harrison_line: "", monologue: "",
  });

  // Step → progress index
  const progressOf = {
    m0: 0, m1: 1, m1b: 1, m1c: 1, m2: 2, m3: 3, m4: 4, m5: 5, m6: 6,
  };

  const handleAuth = (u) => { setUser(u); setStep("home"); };
  const startChapter = () => {
    setProfile(p => ({ ...p, chapterStatus: "in_progress" }));
    setStep("m0");
  };

  const finishChapter = () => {
    // Award points based on outcome
    const win = run.outcome === "rechazada";
    const bonus = win ? 60 : 30;
    setProfile(p => ({
      ...p,
      chapterStatus: "done",
      totalPoints: 180 + bonus,
      stars: win ? 3 : 2,
      lastRun: "hoy",
      skills: [
        { ...p.skills[0], points: win ? 95 : 60, tier: win ? "Skilled" : "Practiced" },
        { ...p.skills[1], points: win ? 75 : 50, tier: "Practiced" },
        { ...p.skills[2], points: win ? 70 : 50, tier: "Practiced" },
      ],
    }));
    setStep("home");
  };

  // Render screens
  let screen = null;
  if (step === "auth") screen = <ScreenAuth onAuth={handleAuth} />;
  else if (step === "home") screen = <ScreenHome user={user} profile={profile} onPlay={startChapter} onProfile={() => {}} />;
  else if (step === "m0") screen = <ScreenRol progress={0} onNext={() => setStep("m1")} />;
  else if (step === "m1") screen = <ScreenM1Notif progress={1} onBack={() => setStep("m0")} onOpen={() => setStep("m1b")} />;
  else if (step === "m1b") screen = <ScreenDossier progress={1} onBack={() => setStep("m1")} onNext={() => setStep("m1c")} />;
  else if (step === "m1c") screen = <ScreenTransition progress={1} onBack={() => setStep("m1b")} content={window.CONTENT.transition1c} onNext={() => setStep("m2")} />;
  else if (step === "m2") screen = <ScreenChoices progress={2} onBack={() => setStep("m1c")} onConfirm={(id) => { setRun(r => ({ ...r, decision_m2: id })); setStep("m3"); }} />;
  else if (step === "m3") screen = <ScreenSia progress={3} onDone={({ result, summary }) => { setRun(r => ({ ...r, sia_result: result, sia_summary: summary })); setStep("m4"); }} />;
  else if (step === "m4") screen = <ScreenHarrison progress={4} siaResult={run.sia_result} siaSummary={run.sia_summary} onDone={({ result, summary }) => { setRun(r => ({ ...r, harrison_result: result, harrison_summary: summary })); setStep("m5"); }} />;
  else if (step === "m5") screen = <ScreenMonologue progress={5} ctx={run} onDone={(r) => { setRun(prev => ({ ...prev, ...r })); setStep("m6"); }} />;
  else if (step === "m6") screen = <ScreenFeedback progress={6} ctx={run} onDone={() => finishChapter()} />;

  return (
    <>
      <div className="pp-app">{screen}</div>
      <ActorInspector />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Tema" />
        <TweakRadio
          label="Modo"
          value={tweaks.theme}
          onChange={v => setTweak("theme", v)}
          options={["dark", "paper"]}
        />
        <TweakSection label="Atajos demo" />
        <TweakButton label="Volver al home" onClick={() => { setStep("home"); }} />
        <TweakButton label="Saltar a decisión M2" onClick={() => { setStep("m2"); }} />
        <TweakButton label="Saltar a chat con Sia" onClick={() => { setRun(r => ({ ...r, decision_m2: r.decision_m2 || "silencio_estrategico" })); setStep("m3"); }} />
        <TweakButton label="Saltar a chat con Harrison" onClick={() => {
          setRun(r => ({
            ...r,
            decision_m2: r.decision_m2 || "silencio_estrategico",
            sia_result: r.sia_result || "se_queda_condicional",
            sia_summary: r.sia_summary || "Sia aceptó quedarse a condición de tener autonomía técnica para liderar la corrección del prototipo. Tono profesional y cauteloso, sin promesas de largo plazo.",
          }));
          setStep("m4");
        }} />
        <TweakButton label="Saltar a votación" onClick={() => {
          setRun(r => ({
            ...r,
            decision_m2: r.decision_m2 || "silencio_estrategico",
            sia_result: "se_queda_condicional",
            sia_summary: "Sia aceptó quedarse para liderar la corrección del prototipo, con condiciones de autonomía.",
            harrison_result: "vota_no_condicional",
            harrison_summary: "Harrison se inclina a votar no, pidió un plan escrito en 48hs.",
          }));
          setStep("m5");
        }} />
        <TweakButton label="Saltar a feedback" onClick={() => {
          setRun(r => ({
            ...r,
            decision_m2: r.decision_m2 || "silencio_estrategico",
            sia_result: "se_queda_condicional",
            sia_summary: "Sia aceptó quedarse para liderar el arreglo del prototipo, con condiciones.",
            harrison_result: "vota_no_condicional",
            harrison_summary: "Harrison vota no, pidió plan escrito.",
            outcome: "rechazada",
            sia_vote: "no", sia_line: "Voto no.",
            harrison_vote: "no", harrison_line: "Voto no, con condiciones.",
          }));
          setStep("m6");
        }} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
