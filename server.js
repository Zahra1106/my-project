import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));


// ================= SCHEMA =================
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);


// ================= SIGNUP =================
app.post("/api/signup", async (req, res) => {
  try {
    console.log("📩 BODY RECEIVED:", req.body);

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
    console.log("✅ USER SAVED SUCCESSFULLY");

    return res.status(201).json({ success: true, message: "Account created successfully 🎉" });

  } catch (error) {
    console.log("❌ FULL ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ================= LOGIN =================
app.post("/api/login", async (req, res) => {
  try {
    console.log("📩 LOGIN BODY:", req.body);

    const { email, password } = req.body;

    // Step 1: Check fields
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Step 2: Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Step 3: Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    // Step 4: Login success
    console.log("✅ LOGIN SUCCESSFUL");
    return res.status(200).json({
      success: true,
      message: "Login successful 🎉",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.log("❌ LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});


export default app;