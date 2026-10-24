const musicModel = require("../models/music.model.js");
const { uploadFile, deleteFile } = require("../services/storage.service.js");
const {
  generateSong,
  GENRE_KEYS,
  LANGUAGES,
} = require("../services/ace.service.js");
const { writeLyrics } = require("../services/lyrics.service.js");

const MAX_PER_HOUR = Number(process.env.AI_SONGS_PER_HOUR) || 10;
const inProgress = new Set();

async function generateMusic(req, res) {
  const userId = req.user.id;
  let locked = false;

  try {
    const prompt = String(req.body.prompt || "").trim();
    const genre = String(req.body.genre || "").trim();
    const lyrics = String(req.body.lyrics || "").trim();
    const language = String(req.body.language || "en").trim();
    const title = String(req.body.title || "").trim() || prompt.slice(0, 40);

    if (prompt.length < 3 || prompt.length > 300) {
      return res
        .status(400)
        .json({ message: "prompt must be 3 to 300 characters" });
    }

    if (!GENRE_KEYS.includes(genre)) {
      return res.status(400).json({ message: "invalid genre" });
    }

    if (!Object.prototype.hasOwnProperty.call(LANGUAGES, language)) {
      return res.status(400).json({ message: "invalid language" });
    }

    if (lyrics.length > 3000) {
      return res.status(400).json({ message: "lyrics are too long" });
    }

    if (title.length > 80) {
      return res.status(400).json({ message: "title is too long" });
    }

    if (inProgress.has(userId)) {
      return res
        .status(429)
        .json({ message: "a song is already being generated, please wait" });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await musicModel.countDocuments({
      artist: userId,
      source: "ai",
      createdAt: { $gte: oneHourAgo },
    });

    if (recentCount >= MAX_PER_HOUR) {
      return res.status(429).json({
        message: "hourly limit reached, please try again later",
      });
    }

    inProgress.add(userId);
    locked = true;

    // Lyrics: user ke diye hue, warna Gemini likhega (chuni hui language mein)
    const finalLyrics =
      lyrics ||
      (await writeLyrics({ prompt, genre, language: LANGUAGES[language] }));

    // Gaana banao
    const song = await generateSong({
      prompt,
      genre,
      lyrics: finalLyrics,
      language,
    });

    // ImageKit par upload karo
    const uploaded = await uploadFile(song.audioBase64);

    let music;
    try {
      music = await musicModel.create({
        uri: uploaded.url,
        fileId: uploaded.fileId,
        title,
        artist: userId,
        source: "ai",
        genre,
        prompt,
        lyrics: finalLyrics,
      });
    } catch (dbErr) {
      // DB save fail hua, to ImageKit se file hata do (orphan nahi rahegi)
      await deleteFile(uploaded.fileId).catch((e) =>
        console.log("cleanup failed", e.message)
      );
      throw dbErr;
    }

    return res.status(201).json({
      message: "song generated successfully",
      music: {
        id: music._id,
        uri: music.uri,
        title: music.title,
        genre: music.genre,
        lyrics: music.lyrics,
        source: music.source,
      },
    });
  } catch (err) {
    console.log("generate failed:", err.message, err.status || "");

    if (err.status === 429 || err.status === 503) {
      return res.status(503).json({
        message: "the AI service is busy, please try again in a few minutes",
      });
    }

    if (err.name === "TimeoutError") {
      return res
        .status(504)
        .json({ message: "generation took too long, please try again" });
    }

    return res.status(500).json({ message: "could not generate song" });
  } finally {
    if (locked) inProgress.delete(userId);
  }
}

module.exports = { generateMusic };