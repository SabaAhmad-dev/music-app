const albumModel = require("../models/album.model.js");
const musicModel = require("../models/music.model.js");
const { deleteFile, getFileDetails } = require("../services/storage.service.js");

async function createMusic(req, res) {
  try {
    const { title, fileId } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    if (!fileId) {
      return res.status(400).json({ message: "fileId is required" });
    }

    // ImageKit se pakka karo ke file asli hai aur hamare music folder mein hai
    const details = await getFileDetails(fileId);

    if (!details || !details.filePath || !details.filePath.startsWith("/backend/music/")) {
      return res.status(400).json({ message: "invalid file" });
    }

    let music;
    try {
      music = await musicModel.create({
        uri: details.url,
        fileId: details.fileId,
        title,
        artist: req.user.id,
      });
    } catch (dbErr) {
      // DB save fail hua, to ImageKit se file hata do (orphan nahi rahegi)
      await deleteFile(details.fileId).catch((e) => console.log("cleanup failed", e));
      throw dbErr;
    }

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

async function deleteOrphanFile(req, res) {
  try {
    const { fileId } = req.params;

    // 1) Agar kisi song se juri hai to kabhi delete nahi karni
    const inUse = await musicModel.exists({ fileId });
    if (inUse) {
      return res.status(409).json({ message: "file is in use" });
    }

    // 2) ImageKit se file ki details lo
    const details = await getFileDetails(fileId);

    // 3) Sirf hamare music folder ki file
    if (!details || !details.filePath || !details.filePath.startsWith("/backend/music/")) {
      return res.status(400).json({ message: "invalid file" });
    }

    // 4) Sirf abhi (10 minute ke andar) upload hui file
    const ageMs = Date.now() - new Date(details.createdAt).getTime();
    if (Number.isNaN(ageMs) || ageMs > 10 * 60 * 1000) {
      return res.status(400).json({ message: "file is too old to clean up" });
    }

    await deleteFile(fileId);
    return res.status(200).json({ message: "orphan file deleted" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
}

module.exports = {
  createMusic,
  createAlbum,
  getAllMusics,
  getAllAlbums,
  deleteMusic,
  deleteOrphanFile,
};