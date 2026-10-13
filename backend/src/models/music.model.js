const mongoose= require("mongoose");


const musicSchema=new mongoose.Schema({
    uri:{
        type:String,
        required:true,
    },

fileId: {
  type: String,
},

    title:{
       type:String,
        required:true,
    },
    artist:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"user",
        required:true,
    }
})

const musicModel= mongoose.model("music",musicSchema);

module.exports=musicModel;

