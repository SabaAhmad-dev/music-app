const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRY_STATUS = [429, 500, 502, 503, 504];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildInstruction(genre) {
  return `You are a professional songwriter.
Write original song lyrics in English for the topic the user gives.
Rules:
- Stay strictly on the user's topic.
- Genre: ${genre}.
- Clean and family-friendly: no profanity, no drugs, no violence, no hate, no sexual content.
- Use section tags on their own lines, for example [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus].
- Write 20 to 32 lines in total.
- Output ONLY the lyrics. No title, no explanation, no markdown.`;
}

async function callGemini(model, key, instruction, prompt) {
  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: "user", parts: [{ text: `Topic: ${prompt}` }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = new Error(`lyrics API error ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("")
    .replace(/```[a-z]*/gi, "")
    .trim();

  if (!text) throw new Error("lyrics were empty or blocked");

  return text.slice(0, 3000);
}

async function writeLyrics({ prompt, genre }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is missing");

  const models = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    process.env.GEMINI_FALLBACK_MODEL,
  ].filter(Boolean);

  const instruction = buildInstruction(genre);
  let lastError;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await callGemini(model, key, instruction, prompt);
      } catch (err) {
        lastError = err;
        console.log(`lyrics: ${model}, attempt ${attempt} failed (${err.message})`);

        const retryable =
          RETRY_STATUS.includes(err.status) || err.name === "TimeoutError";
        if (!retryable) break; // is model ko chhodo, agla model try karo

        await sleep(attempt * 2000);
      }
    }
  }

  throw lastError;
}

module.exports = { writeLyrics };