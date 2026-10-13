import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

function Upload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please choose an mp3 file");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("music", file);

    try {
      setLoading(true);
      await api.post("/api/music/upload", formData);
      navigate("/music");
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    
  <div>
    <Navbar />
      <form onSubmit={handleSubmit}>
      <h2>Upload Music</h2>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>
      {error && <p>{error}</p>}
    </form>
  </div>
  );
}

export default Upload;