import { useState } from "react";
import { useApp } from "../context/AppState";

export default function Composer() {
  const { t, send, busy } = useApp();
  const [input, setInput] = useState("");

  return (
    <form
      className="composer"
      style={{ gridColumn: "2 / 3" }}
      onSubmit={(e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || busy) return;
        send(text);
        setInput("");
      }}
    >
      <label htmlFor="input" className="sr-only">
        {t.placeholder}
      </label>
      <textarea
        id="input"
        rows={1}
        placeholder={t.placeholder}
        value={input}
        disabled={busy}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const text = input.trim();
            if (!text || busy) return;
            send(text);
            setInput("");
          }
        }}
      />
      <button type="submit" disabled={busy || !input.trim()}>
        {t.send}
      </button>
    </form>
  );
}
