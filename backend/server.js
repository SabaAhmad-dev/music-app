require("dotenv").config();
const connectDB =require("./src/db/db.js")
const app=require("./src/app.js");
 

connectDB();


app.listen(3000, ()=>{
    console.log("server is runuing in the port 3000")
})