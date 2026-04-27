import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cartRoutes from "./routes/cartRoutes.js";  
import foodRoutes from "./routes/foodRoutes.js";
import nodemailer from "nodemailer";


dotenv.config();

const app = express();

app.use(express.json());
app.use("/api/cart", cartRoutes);
app.use("/api/food", foodRoutes); // ← ADD
app.use(cors());

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// ================= USER SCHEMA =================
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// ================= SIGNUP =================
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    return res.status(201).json({ success: true, message: "Account created successfully 🎉" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ================= LOGIN =================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful 🎉",
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ================= TEST ROUTE =================
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Server is working! ✅" });
});
// ================= OTP SCHEMA =================
const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

const OTP = mongoose.model("OTP", otpSchema);

// ================= EMAIL TRANSPORTER =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // apni Gmail
    pass: process.env.EMAIL_PASS,   // Gmail App Password
  },
});

// ================= FORGOT PASSWORD - OTP BHEJO =================
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Email not registered" });
    }

    // 6-digit OTP generate karo
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Purana OTP delete karo, naya save karo
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp, expiresAt });

    // Email bhejo
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP - FoodApp",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP is: <strong style="font-size:24px">${otp}</strong></p>
        <p>This OTP expires in 10 minutes.</p>
      `,
    });

    return res.status(200).json({ success: true, message: "OTP sent to your email" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ================= OTP VERIFY =================
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });

    if (!record) {
      return res.status(404).json({ success: false, message: "OTP not found. Request again." });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    return res.status(200).json({ success: true, message: "OTP verified" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ================= RESET PASSWORD =================
app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await OTP.findOne({ email });

    if (!record || record.otp !== otp || record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    await OTP.deleteMany({ email }); // OTP delete karo

    return res.status(200).json({ success: true, message: "Password reset successful 🎉" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


export default app;