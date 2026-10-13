const albumModel = require("../models/album.model.js");
const musicModel = require("../models/music.model.js");
const { uploadFile, deleteFile } = require("../services/storage.service.js");

async function createMusic(req, res) {
  try {
    const { title } = req.body;
    const file = req.file;

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    if (!file) {
      return res.status(400).json({ message: "music file is required" });
    }

    const result = await uploadFile(file.buffer.toString("base64"));

    const music = await musicModel.create({
      uri: result.url,
      fileId: result.fileId,
      title,
      artist: req.user.id,
    });

    return res.status(201).json({
      message: "music created successfully",
      music: {
        id: music._id,
        uri: music.uri,
        title: music.title,
        artist: music.artist,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
}

async function createAlbum(req, res) {
  try {
    const { title, musicIds } = req.body;

    const album = await albumModel.create({
      title,
      artist: req.user.id,
      musics: musicIds,
    });

    return res.status(201).json({
      message: "Album created successfully",
      album: {
        id: album._id,
        title: album.title,
        artist: album.artist,
        music: album.musics,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
}

async function getAllMusics(req, res) {
  try {
    const musics = await musicModel.find().populate("artist", "username email");

    return res.status(200).json({
      message: "Musics fetched successfully",
      musics,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
}

async function getAllAlbums(req, res) {
  try {
    const albums = await albumModel
      .find()
      .populate("artist", "username email")
      .populate("musics");

    return res.status(200).json({
      message: "Albums fetched successfully",
      albums,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
}

async function deleteMusic(req, res) {
  try {
    const music = await musicModel.findById(req.params.id);

    if (!music) {
      return res.status(404).json({ message: "music not found" });
    }

    if (music.artist.toString() !== req.user.id) {
      return res.status(403).json({ message: "you can delete only your own music" });
    }

    // ImageKit se asli file hatao (purane songs mein fileId nahi hoti)
    if (music.fileId) {
      await deleteFile(music.fileId);
    }

    await musicModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "music deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
}

module.exports = { createMusic, createAlbum, getAllMusics, getAllAlbums, deleteMusic };