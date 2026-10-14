import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

function Upload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (!file) {
      setError("Please choose an mp3 file");
      return;
    }

    const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
    if (!publicKey) {
      setError("ImageKit public key is missing");
      return;
    }

    let uploadedFileId = null;

    try {
      setLoading(true);

      // 1) Backend se signature lo
      const authRes = await api.get("/api/music/imagekit-auth");
      const { token, expire, signature } = authRes.data;

      // 2) File seedha ImageKit par bhejo
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", "music_" + Date.now());
      formData.append("folder", "backend/music");
      formData.append("publicKey", publicKey);
      formData.append("token", token);
      formData.append("expire", expire);
      formData.append("signature", signature);

      const ikRes = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
      const ikData = await ikRes.json();

      if (!ikRes.ok) {
        throw new Error(ikData.message || "ImageKit upload failed");
      }

      uploadedFileId = ikData.fileId;

      // 3) Backend ko sirf title aur fileId do
      await api.post("/api/music/upload", {
        title,
        fileId: uploadedFileId,
      });

      navigate("/music");
    } catch (err) {
      // File ImageKit par chali gayi lekin save fail hua, to hata do
      if (uploadedFileId) {
        try {
          await api.delete(`/api/music/orphan/${uploadedFileId}`);
        } catch (cleanupErr) {
          console.log("cleanup failed", cleanupErr);
        }
      }
      setError(err.response?.data?.message || err.message || "Upload failed");
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