import { useState } from "react";
import { useApp } from "../context/AppState";

export default function Sidebar() {
  const {
    t,
    user,
    logout,
    sessions,
    activeId,
    setActiveId,
    createSession,
    renameSession,
    deleteSession,
    lang,
    setLang,
    simulator,
    setSimulator,
  } = useApp();

  const [showResources, setShowResources] = useState(false);

  return (
    <aside className="sidebar" style={asideStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>{t.history}</div>
        <button onClick={createSession} title={t.newChat} className="chip">＋</button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, background: "#0f1218", display: "grid", placeItems: "center", border: "1px solid var(--border)" }}>🧑</div>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          {user?.email && <div style={{ color: "var(--muted)", fontSize: 12 }}>{user.email}</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setLang(lang === "en" ? "fr" : "en")} className="chip" title={t.language}>
          {lang === "en" ? "FR" : "EN"}
        </button>
        <button onClick={() => setSimulator(!simulator)} className="chip" title="Toggle simulator">
          {simulator ? t.simulatorOn : t.simulatorOff}
        </button>
        <button onClick={() => setShowResources((v) => !v)} className="chip">{t.resources}</button>
      </div>

      {showResources && (
        <div style={{ marginBottom: 12, border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li><a href="https://fastapi.tiangolo.com/" target="_blank">FastAPI</a></li>
            <li><a href="https://vitejs.dev/" target="_blank">Vite</a></li>
            <li><a href="https://react.dev/" target="_blank">React</a></li>
            <li><a href="https://github.com/ollama/ollama" target="_blank">Ollama</a></li>
          </ul>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8, overflow: "auto" }}>
        {sessions.map((s) => (
          <div
            key={s.id}
            className="history-item"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: `1px solid ${s.id === activeId ? "var(--accent)" : "var(--border)"}`,
              background: s.id === activeId ? "#0f1218" : "transparent",
              marginBottom: 8,
              cursor: "pointer",
            }}
            onClick={() => setActiveId(s.id)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center" }}>
              <div style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 150 }}>
                {s.title}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="chip" onClick={(e) => { e.stopPropagation(); renameSession(s.id); }}>{t.rename}</button>
                <button className="chip" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}>{t.delete}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
        <button className="chip" onClick={logout}>{t.logout}</button>
      </div>
    </aside>
  );
}

const asideStyle: React.CSSProperties = {
  gridRow: "1 / span 3",
  padding: 12,
  borderRight: "1px solid var(--border)",
  background: "var(--panel)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};