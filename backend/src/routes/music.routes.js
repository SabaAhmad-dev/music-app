const express= require("express");
const musicController= require("../controllers/music.controller.js")
const multer= require("multer");
const authMiddleware= require('../middlewares/auth.middleware.js')

const upload=multer({
     storage:multer.memoryStorage()
})

const router=express.Router();


router.post("/upload",authMiddleware.authArtist,upload.single("music"),musicController.createMusic)

router.post("/album",authMiddleware.authArtist, musicController.createAlbum)

router.get("/",authMiddleware.authUser, musicController.getAllMusics)
router.get("/albums", authMiddleware.authUser, musicController.getAllAlbums)
router.delete("/:id", authMiddleware.authArtist, musicController.deleteMusic);
module.exports=router;