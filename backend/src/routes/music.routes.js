const express = require("express");
const musicController = require("../controllers/music.controller.js");

const authMiddleware = require("../middlewares/auth.middleware.js");
const storageService = require("../services/storage.service.js");



const router = express.Router();

router.post("/upload", authMiddleware.authArtist, musicController.createMusic);

router.get("/imagekit-auth", authMiddleware.authArtist, (req, res) => {
  try {
    const params = storageService.getAuthParams();
    res.status(200).json(params);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not create upload signature" });
  }
});

router.post("/album", authMiddleware.authArtist, musicController.createAlbum);

router.get("/", authMiddleware.authUser, musicController.getAllMusics);
router.get("/albums", authMiddleware.authUser, musicController.getAllAlbums);
router.delete("/:id", authMiddleware.authArtist, musicController.deleteMusic);

module.exports = router;