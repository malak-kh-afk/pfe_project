import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { useApp } from "../context/AppState";
import { dayLabel, timeLabel, isSameDay } from "../utils/time";

// Markdown + syntax highlighting
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"; // << important
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

import "./MessageList.css"; // make sure this file exists

export default function MessageList() {
  const { sessions, activeId, t, lang, busy } = useApp();
  const active = sessions.find((s) => s.id === activeId)!;

  const streamRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (atBottom) {
      streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });
    }
  }, [active?.messages, atBottom]);

  // Detect if user scrolled up
  useEffect(() => {
    const el = streamRef.current;
    if (!el) return;

    const onScroll = () => {
      setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Build message list with day separators
  const list: JSX.Element[] = [];

  for (let i = 0; i < active.messages.length; i++) {
    const m = active.messages[i];
    const showSep = i === 0 || !isSameDay(m.ts, active.messages[i - 1].ts);

    if (showSep) {
      list.push(
        <div key={`sep-${m.id}`} className="separator">
          <span>
            {dayLabel(m.ts, lang, t.today, t.yesterday)} • {timeLabel(m.ts, lang)}
          </span>
        </div>
      );
    }

    list.push(
      <div key={m.id} className={`msg msg--${m.role}`}>
        <img
          className="avatar"
          src={m.role === "user" ? "/u.png" : "/a.png"}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const span = document.createElement("span");
            span.textContent = m.role === "user" ? "🧑" : "🤖";
            e.currentTarget.parentElement?.insertBefore(span, e.currentTarget);
          }}
        />

        <div className="bubble-content">
             <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeHighlight]}
              >
             {m.markdown ?? m.html ?? m.content}
             </ReactMarkdown>
        <div className="meta-time">{timeLabel(m.ts, lang)}</div>
        </div>
      </div>
    );
  }

  return (
    <main
      ref={streamRef}
      className="chat__main"
      style={{ gridColumn: "2 / 3" }}
      aria-live="polite"
      aria-busy={busy}
    >
      {list}

      {!atBottom && (
        <button
          className="scroll-bottom"
          onClick={() =>
            streamRef.current?.scrollTo({
              top: streamRef.current.scrollHeight,
              behavior: "smooth",
            })
          }
        >
          ↓ {t.scrollDown}
        </button>
      )}
    </main>
  );
}
