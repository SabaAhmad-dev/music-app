const cors = require("cors");
const express=require("express");
 const cookieParser= require("cookie-parser");
const authRouter=require("./routes/auth.routes.js")
const musicRouter=require("./routes/music.routes.js")

const app=express();
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/",(req,res)=>{
  res.json({
   message:" hello"
  })
})
app.use("/api/auth",authRouter)
app.use("/api/music",musicRouter)

module.exports=app;