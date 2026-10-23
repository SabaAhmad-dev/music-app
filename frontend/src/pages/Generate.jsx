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

function Generate() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("pop");
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

          <textarea
            placeholder="Your own lyrics (optional). Leave empty and AI will write them."
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