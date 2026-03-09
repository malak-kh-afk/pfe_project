import { useApp } from "../context/AppState";

export default function HeaderBar() {
  const { t, statusText } = useApp();
  return (
    <header className="chat__header" style={{ gridColumn: "2 / 3" }}>
      <div className="brand">
        <div className="brand__name">{t.title}</div>
        <div className="brand__status">
          <span className={`status-dot ${statusText === "typing" ? "typing" : "status-dot--online"}`}></span>
          {statusText === "typing" ? t.typing : `${t.online} • ${t.ready}`}
        </div>
      </div>
    </header>
  );
}
