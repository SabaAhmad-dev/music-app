import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";

function Music() {
  const [musics, setMusics] = useState([]);
  const [meId, setMeId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const audioRefs = useRef({});

  useEffect(() => {
    async function fetchMusics() {
      try {
        const res = await api.get("/api/music/");
        setMusics(res.data.musics || []);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError("Could not load music");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMusics();
  }, [navigate]);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await api.get("/api/auth/me");
        setMeId(res.data.user.id);
      } catch {
        setMeId(null);
      }
    }
    fetchMe();
  }, []);

  function handlePlay(id) {
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      if (key !== id && audio && !audio.paused) {
        audio.pause();
      }
    });
  }

  async function confirmDelete() {
    try {
      await api.delete(`/api/music/${deleteId}`);
      setMusics((prev) => prev.filter((m) => m._id !== deleteId));
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div>
      <Navbar />
      <h2>All Music</h2>
      <p className="subtitle">Pick a track and press play</p>

      {loading && <p className="empty">Loading...</p>}
      {error && <p className="empty">{error}</p>}
      {!loading && !error && musics.length === 0 && (
        <p className="empty">No music yet</p>
      )}

      <div className="music-grid">
        {musics.map((m) => (
          <div className="music-card" key={m._id}>
            <div className="cover">🎧</div>
            <h4>{m.title}</h4>
            <p className="artist-name">{m.artist?.username}</p>
            {m.source === "ai" && (
              <span className="ai-badge">
                ✨ AI{m.genre ? ` · ${m.genre}` : ""}
              </span>
            )}
            <audio
              controls
              src={m.uri}
              ref={(el) => (audioRefs.current[m._id] = el)}
              onPlay={() => handlePlay(m._id)}
            ></audio>
            {meId && String(m.artist?._id || m.artist) === meId && (
              <button className="delete-btn" onClick={() => setDeleteId(m._id)}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this song?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Music;