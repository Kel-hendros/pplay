// Shared UI primitives — status bar, top bar, buttons.
// Loaded before screens.

const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

// ───── Status Bar (mobile chrome) ─────
function StatusBar({ time = "9:41" }) {
  return (
    <div className="pp-status">
      <span>{time}</span>
      <div className="pp-dots">
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.6" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.6" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.6" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.6" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4 }}>5G</span>
        <span className="pp-batt" style={{ marginLeft: 6 }}></span>
      </div>
    </div>
  );
}

// ───── Top bar with progress segments ─────
function TopBar({ onBack, progress, label, totalSegments = 6 }) {
  const segs = [];
  for (let i = 0; i < totalSegments; i++) {
    const cls = i < progress ? "seg done" : i === progress ? "seg active" : "seg";
    segs.push(<span key={i} className={cls} />);
  }
  return (
    <div className="pp-topbar">
      {onBack ? (
        <button className="pp-topbar-back" onClick={onBack} aria-label="Back">←</button>
      ) : (
        <div style={{ width: 36 }} />
      )}
      <div className="pp-topbar-progress">{segs}</div>
      <div className="pp-topbar-label">{label}</div>
    </div>
  );
}

// ───── Button ─────
function Btn({ children, primary, ghost, block, lg, sticky, disabled, onClick, style }) {
  const cls = [
    "btn",
    primary && "btn-primary",
    ghost && "btn-ghost",
    block && "btn-block",
    lg && "btn-lg",
    sticky && "btn-sticky",
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} disabled={disabled} onClick={onClick} style={style}>
      {children} {primary && !lg && <span style={{ marginLeft: 4 }}>→</span>}
    </button>
  );
}

// ───── Avatar ─────
function Avatar({ name, color, size = 32, square }) {
  const initial = name ? name.split(" ").map(p => p[0]).slice(0, 2).join("") : "?";
  const style = {
    width: size, height: size,
    borderRadius: square ? 8 : "50%",
    background: color || "var(--surface-2)",
    color: color ? "#0c0c0e" : "var(--ink)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--serif)", fontSize: size * 0.5,
    border: color ? "none" : "1px solid var(--line)",
    flexShrink: 0,
  };
  return <span style={style}>{initial}</span>;
}

// ───── Chat message ─────
function ChatMsg({ name, color, mine, children, meta }) {
  return (
    <>
      {meta && <div className={mine ? "chat-meta chat-meta-mine" : "chat-meta"}>{meta}</div>}
      <div className={mine ? "chat-msg chat-msg-mine" : "chat-msg"}>
        {!mine && <Avatar name={name} color={color} />}
        <div className="bub">{children}</div>
        {mine && <Avatar name="Tú" />}
      </div>
    </>
  );
}

function TypingMsg({ name, color }) {
  return (
    <div className="chat-msg">
      <Avatar name={name} color={color} />
      <div className="bub" style={{ padding: "14px 16px" }}>
        <span className="dots"><span></span><span></span><span></span></span>
      </div>
    </div>
  );
}

// ───── Compose box ─────
function Compose({ onSend, placeholder = "Escribí tu mensaje…", disabled }) {
  const [val, setVal] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(140, el.scrollHeight) + "px";
  }, [val]);
  const send = () => {
    const t = val.trim();
    if (!t || disabled) return;
    onSend(t);
    setVal("");
  };
  return (
    <div className="compose">
      <textarea
        ref={ref}
        rows={1}
        placeholder={placeholder}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
        }}
        disabled={disabled}
      />
      <button className="compose-send" onClick={send} disabled={!val.trim() || disabled} aria-label="Enviar">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 9L16 9M16 9L10 3M16 9L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

Object.assign(window, { StatusBar, TopBar, Btn, Avatar, ChatMsg, TypingMsg, Compose });
