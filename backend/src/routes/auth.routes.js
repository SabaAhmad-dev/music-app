const express=require("express");
const authRouter=require("../controllers/auth.controller")
const router=express.Router();





router.post("/register",authRouter.userRegister)
router.post("/login",authRouter.loginUser)

router.post("/logout", authRouter.logoutUser);
router.get("/me", authRouter.getMe);
module.exports=router;