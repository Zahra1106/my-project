import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // ✅ .env load kar raha hai

const app = express();

app.use(express.json());
app.use(cors());

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB Connected");
})
.catch(err => console.log("❌ DB Error:", err));


// ================= SCHEMA =================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);


// ================= SIGNUP =================
app.post("/api/signup", async (req, res) => {
  try {
    console.log("📩 BODY RECEIVED:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    const user = new User({ name, email, password });

    await user.save();

    console.log("✅ USER SAVED SUCCESSFULLY");

    return res.status(201).json({
      success: true,
      message: "Account created successfully 🎉"
    });

  } catch (error) {
    console.log("❌ FULL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default app;