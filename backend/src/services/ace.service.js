const API_URL = "https://api.acemusic.ai/v1/chat/completions";

const GENRES = {
  classical: "classical orchestral music with strings and piano",
  "hip-hop": "hip-hop with a strong beat, deep bass and rhythmic rap vocals",
  pop: "catchy modern pop with clear sung vocals",
  rock: "energetic rock with electric guitars and live drums",
  "lo-fi": "relaxed lo-fi with mellow beats and soft vocals",
  jazz: "smooth jazz with saxophone, piano and warm vocals",
  edm: "high-energy EDM with synths and powerful drops",
  folk: "warm acoustic folk with guitar and heartfelt vocals",
  ghazal: "soulful ghazal with harmonium, tabla and emotional vocals",
  qawwali: "sufi qawwali with harmonium, tabla, hand claps and powerful vocals",
};

const GENRE_KEYS = Object.keys(GENRES);

const LANGUAGES = {
  ar: "Arabic",
  az: "Azerbaijani",
  bg: "Bulgarian",
  bn: "Bengali",
  ca: "Catalan",
  cs: "Czech",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  fa: "Persian",
  fi: "Finnish",
  fr: "French",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  ht: "Haitian Creole",
  hu: "Hungarian",
  id: "Indonesian",
  is: "Icelandic",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  la: "Latin",
  lt: "Lithuanian",
  ms: "Malay",
  ne: "Nepali",
  nl: "Dutch",
  no: "Norwegian",
  pa: "Punjabi",
  pl: "Polish",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sa: "Sanskrit",
  sk: "Slovak",
  sr: "Serbian",
  sv: "Swedish",
  sw: "Swahili",
  ta: "Tamil",
  te: "Telugu",
  th: "Thai",
  tl: "Tagalog",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  vi: "Vietnamese",
  yue: "Cantonese",
  zh: "Chinese",
};

function buildRequest({ prompt, genre, lyrics, instrumental, language }) {
  const cleanLyrics = (lyrics || "").trim();
  const langCode = language || "en";
  const langName = LANGUAGES[langCode];
  const style = `${GENRES[genre]}. Song topic: ${prompt}. Vocals sung in ${langName}.`;

  const body = {
    messages: [{ role: "user", content: style }],
    stream: true,
    batch_size: 1,
    audio_config: {
      vocal_language: langCode,
      instrumental: Boolean(instrumental),
      format: "mp3",
    },
  };

  if (cleanLyrics && !instrumental) {
    // User ne lyrics diye hain, wahi use honge
    body.lyrics = cleanLyrics;
  } else {
    // Lyrics nahi diye, tool khud likhega
    body.sample_mode = true;
    body.messages = [
      {
        role: "user",
        content: `${style} The lyrics must stay on this topic, be clean and family-friendly, with no profanity, no drugs and no violence.`,
      },
    ];
  }

  return body;
}

async function generateSong(options) {
  const key = process.env.ACE_MUSIC_API_KEY;
  if (!key) throw new Error("ACE_MUSIC_API_KEY is missing");
  if (!GENRES[options.genre]) throw new Error("invalid genre");
  if (options.language && !LANGUAGES[options.language]) {
    throw new Error("invalid language");
  }
  if (!options.prompt || !options.prompt.trim()) {
    throw new Error("prompt is required");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(
      buildRequest({ ...options, prompt: options.prompt.trim() })
    ),
    signal: AbortSignal.timeout(240000),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    const err = new Error(`music API error ${res.status}`);
    err.status = res.status;
    err.details = text.slice(0, 200);
    throw err;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let audioUrl = null;

  function handleLine(line) {
    if (!line.startsWith("data: ")) return;
    const payload = line.slice(6).trim();
    if (payload === "[DONE]") return;

    let json;
    try {
      json = JSON.parse(payload);
    } catch (e) {
      return;
    }

    if (json.error) {
      throw new Error("music API stream error");
    }

    const delta = json?.choices?.[0]?.delta || {};
    if (delta.content === ".") return; // heartbeat
    if (delta.content) content += delta.content;
    if (delta.audio?.[0]?.audio_url?.url) {
      audioUrl = delta.audio[0].audio_url.url;
    }
  }

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    lines.forEach(handleLine);
  }
  handleLine(buffer);

  if (!audioUrl) throw new Error("no audio received");

  const [header, base64] = audioUrl.split(",");
  const mimeType =
    header.replace("data:", "").replace(";base64", "") || "audio/mpeg";

  const parts = content.split(/##\s*Lyrics/i);
  const lyricsText = parts.length > 1 ? parts[1].trim() : "";

  return {
    audioBase64: base64,
    mimeType,
    metadata: content.trim(),
    lyrics: lyricsText,
  };
}

module.exports = { generateSong, GENRE_KEYS, LANGUAGES };