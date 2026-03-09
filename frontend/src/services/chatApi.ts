// SSE streaming to FastAPI via Vite proxy
export async function* streamSSE(prompt: string, userId?: number) {
  const res = await fetch("/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, user_id: userId ?? 0 }),
  });
  if (!res.ok || !res.body) throw new Error("Bad response");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const p of parts) {
      if (p.startsWith("data: ")) yield p.slice(6);
      if (p.startsWith("event: done")) return;
    }
  }
}

// Local simulator: bilingual tiny chunks
export function simulateChunks(lang: "fr" | "en") {
  const variantsEn = [
    ["Got it, ", "I’d do it this way: ", "stream the reply, ", "show typing, ", "keep paragraphs short. "],
    ["Understood. ", "Quick plan: ", "stream chunks, ", "indicator first, ", "be concise. "],
    ["Okay. ", "Here’s the gist: ", "send tokens as ready, ", "avoid filler, ", "use bullets when useful. "],
  ];
  const variantsFr = [
    ["Compris. ", "Je ferais ainsi : ", "réponse en flux, ", "indicateur de saisie, ", "paragraphes courts. "],
    ["D’accord. ", "Plan rapide : ", "envoyer par fragments, ", "afficher l’indicateur, ", "rester concis. "],
    ["Bien reçu. ", "En bref : ", "envoi au fil de l’eau, ", "éviter le remplissage, ", "utiliser des puces si utile. "],
  ];
  const base = (lang === "fr" ? variantsFr : variantsEn)[Math.floor(Math.random() * 3)];
  const follow = lang === "fr"
    ? ["Voulez‑vous un exemple ?", "Souhaitez‑vous un résumé ?", "Je détaille en étapes ?"]
    : ["Want an example?", "Prefer a short summary?", "Shall I break it into steps?"];
  return [...base, `\n\n— ${follow[Math.floor(Math.random() * follow.length)]}`];
}
``
