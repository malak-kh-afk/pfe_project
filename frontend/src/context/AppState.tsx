import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { i18n } from "../i18n";
import { esc, uid } from "../utils/html";
import { simulateChunks, streamSSE } from "../services/chatApi";
import type { Msg, Session, StatusText, User } from "../types";

export type Lang = "en" | "fr";

const LS_SESSIONS = "chat:sessions:v1";
const LS_USER = "chat:user:v1";
const LS_LANG = "chat:lang:v1";
const LS_SIM = "chat:simulator:v1";

type AppState = {
  lang: Lang;
  t: Record<string, string>;
  setLang: (l: Lang) => void;

  user: User;
  login: (name: string, email?: string) => void;
  logout: () => void;

  sessions: Session[];
  activeId: string;
  setActiveId: (id: string) => void;
  createSession: () => void;
  renameSession: (id: string, title?: string) => void;
  deleteSession: (id: string) => void;

  simulator: boolean;
  setSimulator: (v: boolean) => void;

  statusText: StatusText;
  busy: boolean;

  send: (text: string) => Promise<void>;

  appendMessage: (sessionId: string, msg: Msg) => void;
  updateMessage: (sessionId: string, msg: Msg) => void;
};

const Ctx = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AppState not found");
  return ctx;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LS_LANG) as Lang) || "en");
  const t = useMemo(() => i18n[lang], [lang]);

  const [user, setUser] = useState<User>(() => {
    const raw = localStorage.getItem(LS_USER);
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const raw = localStorage.getItem(LS_SESSIONS);
    if (raw) return JSON.parse(raw) as Session[];
    return [{ id: uid(), title: t.newChat, createdAt: Date.now(), messages: [] }];
  });

  const [activeId, setActiveId] = useState<string>(() => sessions[0]?.id);

  const [simulator, _setSimulator] = useState<boolean>(() => localStorage.getItem(LS_SIM) === "1");
  const [statusText, setStatusText] = useState<StatusText>("ready");
  const [busy, setBusy] = useState(false);

  useEffect(() => localStorage.setItem(LS_LANG, lang), [lang]);
  useEffect(() => localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions)), [sessions]);

  const setSimulator = (v: boolean) => {
    _setSimulator(v);
    localStorage.setItem(LS_SIM, v ? "1" : "0");
  };

async function login(email: string, password: string, mode: "signin" | "signup") {
  const endpoint = mode === "signup" ? "/auth/register" : "/auth/login";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Authentication failed");
  }

  const data = await res.json(); // expects { user_id, name? }

  // Construct the profile that your app uses
  const profile = {
    name: data.name || email,
    email,
  };

  // Save to React state
  setUser(profile);

  // Save to localStorage
  localStorage.setItem(LS_USER, JSON.stringify(profile));

  // OPTIONAL: Clear sessions if switching user
  localStorage.removeItem(LS_SESSIONS);

  // Force a new default session
  const fresh = [{
    id: uid(),
    title: t.newChat,
    createdAt: Date.now(),
    messages: []
  }];

  setSessions(fresh);
  setActiveId(fresh[0].id);
}


  function logout() {
    setUser(null);
    localStorage.removeItem(LS_USER);
  }

  function createSession() {
    const s: Session = { id: uid(), title: t.newChat, createdAt: Date.now(), messages: [] };
    setSessions((all) => [s, ...all]);
    setActiveId(s.id);
  }

  function renameSession(id: string, newTitle?: string) {
    const title = newTitle ?? prompt(t.rename, sessions.find((x) => x.id === id)?.title || "")?.trim();
    if (!title) return;
    setSessions((all) => all.map((s) => (s.id === id ? { ...s, title } : s)));
  }

  function deleteSession(id: string) {
    if (!confirm(t.confirmDelete)) return;
    setSessions((all) => {
      const next = all.filter((s) => s.id !== id);
      const fallback = next.length ? next[0].id : uid();
      setActiveId(next.length ? next[0].id : fallback);
      return next.length ? next : [{ id: fallback, title: t.newChat, createdAt: Date.now(), messages: [] }];
    });
  }

  function appendMessage(sessionId: string, msg: Msg) {
    setSessions((all) =>
      all.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, msg] } : s))
    );
  }

  function updateMessage(sessionId: string, msg: Msg) {
    setSessions((all) =>
      all.map((s) =>
        s.id === sessionId
          ? { ...s, messages: s.messages.map((m) => (m.id === msg.id ? msg : m)) }
          : s
      )
    );
  }

  async function send(text: string) {
    const session = sessions.find((s) => s.id === activeId)!;
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: Msg = { id: uid(), role: "user", html: esc(trimmed), ts: Date.now() };
    appendMessage(activeId, userMsg);

    if (session.title === "New chat" || session.title === t.newChat) {
      renameSession(activeId, trimmed.slice(0, 40));
    }

    setBusy(true);
    setStatusText("typing");

    try {
      const assistantId = uid();
      let assistant: Msg = { id: assistantId, role: "assistant", html: "", ts: Date.now() };
      appendMessage(activeId, assistant);

      if (simulator) {
        for (const chunk of simulateChunks(lang)) {
          await new Promise((r) => setTimeout(r, 250 + Math.random() * 250));
          assistant = { ...assistant, html: assistant.html + chunk };
          updateMessage(activeId, assistant);
        }
      } else {
        for await (const chunk of streamSSE(trimmed)) {
          assistant = { ...assistant, html: assistant.html + chunk };
          updateMessage(activeId, assistant);
        }
      }
    } catch (e) {
      const err: Msg = {
        id: uid(),
        role: "assistant",
        html: esc(`⚠ ${t.error}`),
        ts: Date.now(),
      };
      appendMessage(activeId, err);
    } finally {
      setBusy(false);
      setStatusText("ready");
    }
  }

  const value: AppState = {
    lang,
    t,
    setLang,
    user,
    login,
    logout,
    sessions,
    activeId,
    setActiveId,
    createSession,
    renameSession,
    deleteSession,
    simulator,
    setSimulator,
    statusText,
    busy,
    send,
    appendMessage,
    updateMessage,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
