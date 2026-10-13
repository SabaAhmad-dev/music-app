const ImageKit = require("@imagekit/nodejs").default;

const ImageKitClient = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});
async function uploadFile(file){
    const result=await ImageKitClient.files.upload({
        file,
        fileName:"music_"+Date.now(),
        folder:"backend/music"
    })


    return  result;
}

async function deleteFile(fileId) {
  await ImageKitClient.files.delete(fileId);
}
module.exports = { uploadFile,deleteFile };