import { useState } from "react";
import { useApp}  from "../context/AppState";
export type Lang = "en" | "fr";

export default function Auth() {
  const { t, lang, setLang, login } = useApp();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    email.trim().length > 3 &&
    password.trim().length >= 6 &&
    (mode === "signin" || password === password2);

  async function onSubmit() {
    if (!canSubmit) return;
    try {
      await login(email.trim(), password.trim(), mode);
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    }
  }

  return (
    <div
      className="chat auth"
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--bg)", // ensures full-page background
        padding: 0,
        margin: 0,
      }}
    >
      <div
        style={{
          width: 380,
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          boxShadow: "var(--shadow)",
        }}
      >

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button
            style={tabStyle(mode === "signin")}
            onClick={() => setMode("signin")}
          >
            Sign In
          </button>
          <button
            style={tabStyle(mode === "signup")}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* Email */}
        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ marginBottom: 4 }}>Email</div>
          <input
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* Password */}
        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ marginBottom: 4 }}>Password</div>
          <input
            type="password"
            value={password}
            placeholder="••••••"
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* Confirm password if Sign Up */}
        {mode === "signup" && (
          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>Confirm Password</div>
            <input
              type="password"
              value={password2}
              placeholder="Repeat password"
              onChange={(e) => setPassword2(e.target.value)}
              style={inputStyle}
            />
          </label>
        )}

        {/* Language */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--muted)" }}>{t.language}</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{
              background: "#0f1218",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "6px 8px",
            }}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#2d1919",
              color: "#e87171",
              padding: "8px 10px",
              borderRadius: 8,
              marginBottom: 10,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={onSubmit}
          style={{
            ...buttonStyle,
            opacity: canSubmit ? 1 : 0.6,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  );
}

// Styles

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px 0",
  borderRadius: 8,
  background: active ? "var(--accent)" : "#0f1218",
  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
  color: active ? "#0b0c10" : "var(--text)",
  fontWeight: 600,
  cursor: "pointer",
});


const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "#0f1218",
  color: "var(--text)",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--accent)",
  color: "#0b0c10",
  fontWeight: 600,
  cursor: "pointer",
};
