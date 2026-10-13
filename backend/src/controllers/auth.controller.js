const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const isProd = process.env.NODE_ENV === "production";

// Cookie ki settings ek jagah (set aur clear dono mein same honi chahiye)
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
};

function createToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

async function userRegister(req, res) {
  try {
    const { username, password, email, role = "user" } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }

    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyExists) {
      return res.status(409).json({ message: "user already exist" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hash,
      role,
    });

    const token = createToken(user);
    res.cookie("token", token, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(201).json({
      message: "user registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    const token = createToken(user);
    res.cookie("token", token, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      message: "user logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
}

async function logoutUser(req, res) {
  res.clearCookie("token", cookieOptions);
  return res.status(200).json({ message: "user logged out successfully" });
}

async function getMe(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({
      user: { id: decoded.id, role: decoded.role },
    });
  } catch (err) {
    return res.status(401).json({ message: "unauthorized" });
  }
}

module.exports = { userRegister, loginUser, logoutUser, getMe };