import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

const GENRES = [
  { value: "pop", label: "Pop" },
  { value: "hip-hop", label: "Hip-hop" },
  { value: "classical", label: "Classical" },
  { value: "rock", label: "Rock" },
  { value: "lo-fi", label: "Lo-fi" },
  { value: "jazz", label: "Jazz" },
  { value: "edm", label: "EDM" },
  { value: "folk", label: "Folk" },
  { value: "ghazal", label: "Ghazal" },
  { value: "qawwali", label: "Qawwali / Sufi" },
];

// Code backend ki list se bilkul same hone chahiye
const LANGUAGES = [
  { value: "ur", label: "Urdu" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "pa", label: "Punjabi" },
  { value: "ar", label: "Arabic" },
  { value: "az", label: "Azerbaijani" },
  { value: "bn", label: "Bengali" },
  { value: "bg", label: "Bulgarian" },
  { value: "ca", label: "Catalan" },
  { value: "zh", label: "Chinese" },
  { value: "hr", label: "Croatian" },
  { value: "cs", label: "Czech" },
  { value: "da", label: "Danish" },
  { value: "nl", label: "Dutch" },
  { value: "fi", label: "Finnish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "el", label: "Greek" },
  { value: "ht", label: "Haitian Creole" },
  { value: "he", label: "Hebrew" },
  { value: "hu", label: "Hungarian" },
  { value: "is", label: "Icelandic" },
  { value: "id", label: "Indonesian" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "la", label: "Latin" },
  { value: "lt", label: "Lithuanian" },
  { value: "ms", label: "Malay" },
  { value: "ne", label: "Nepali" },
  { value: "no", label: "Norwegian" },
  { value: "fa", label: "Persian" },
  { value: "pl", label: "Polish" },
  { value: "pt", label: "Portuguese" },
  { value: "ro", label: "Romanian" },
  { value: "ru", label: "Russian" },
  { value: "sa", label: "Sanskrit" },
  { value: "sr", label: "Serbian" },
  { value: "sk", label: "Slovak" },
  { value: "es", label: "Spanish" },
  { value: "sw", label: "Swahili" },
  { value: "sv", label: "Swedish" },
  { value: "tl", label: "Tagalog" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "th", label: "Thai" },
  { value: "tr", label: "Turkish" },
  { value: "uk", label: "Ukrainian" },
  { value: "vi", label: "Vietnamese" },
  { value: "yue", label: "Cantonese" },
];

function Generate() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("pop");
  const [language, setLanguage] = useState("ur");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);

  // Generate hote waqt seconds ginta hai
  useEffect(() => {
    if (!loading) return;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    const cleanPrompt = prompt.trim();
    const cleanTitle = title.trim();
    const cleanLyrics = lyrics.trim();

    if (cleanPrompt.length < 3) {
      setError("Please describe your song (at least 3 characters)");
      return;
    }
    if (cleanPrompt.length > 300) {
      setError("Description is too long (max 300 characters)");
      return;
    }
    if (cleanTitle.length > 80) {
      setError("Title is too long (max 80 characters)");
      return;
    }
    if (cleanLyrics.length > 3000) {
      setError("Lyrics are too long (max 3000 characters)");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/api/music/generate",
        {
          prompt: cleanPrompt,
          genre,
          language,
          title: cleanTitle,
          lyrics: cleanLyrics,
        },
        { timeout: 240000 }
      );
      setResult(res.data.music);
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError(
          "This is taking longer than expected. Check the Music page in a minute, your song may be ready."
        );
      } else {
        setError(err.response?.data?.message || "Could not generate song");
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setPrompt("");
    setTitle("");
    setLyrics("");
    setError("");
  }

  return (
    <div>
      <Navbar />

      {result ? (
        <div className="generate-result">
          <h2>{result.title}</h2>
          <small className="generate-hint">{result.genre} · AI generated</small>
          <audio controls src={result.uri} />

          {result.lyrics && (
            <>
              <h3>Lyrics</h3>
              <pre className="generate-lyrics">{result.lyrics}</pre>
            </>
          )}

          <div className="generate-actions">
            <Link to="/music">Go to Music</Link>
            <button type="button" onClick={reset}>
              Generate another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2>Generate a Song</h2>

          <input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Describe your song, e.g. a happy song about friendship"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <small className="generate-hint">{prompt.length}/300</small>

          <label className="generate-label">Genre</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>

          <label className="generate-label">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Your own lyrics (optional). Leave empty and AI will write them in the chosen language."
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={6}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate Song"}
          </button>

          {loading && (
            <small className="generate-hint">
              Creating your song... {seconds}s. This usually takes 1 to 2
              minutes, please do not close this page.
            </small>
          )}

          {error && <p>{error}</p>}
        </form>
      )}
    </div>
  );
}

export default Generate;