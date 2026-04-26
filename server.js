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

// ================= FOOD SCHEMA =================
const foodSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  image:    { type: String, required: true },
  price:    { type: Number, required: true },
  rating:   { type: Number, required: true },
  category: { type: String, required: true },
});

const Food = mongoose.model("Food", foodSchema);


// ================= SEED FOODS (Pehli baar data add karo) =================
app.get("/api/seed", async (req, res) => {
  try {
    await Food.deleteMany(); // Purana data delete karo

    const foods = [
      // Burgers
      { name: "Classic Cheeseburger", image: "burger/b.jpeg",  price: 1005, rating: 4.7, category: "Burger" },
      { name: "Bacon Burger",         image: "burger/b2.jpeg", price: 1500, rating: 4.9, category: "Burger" },
      { name: "Mushroom Burger",      image: "burger/b3.jpeg", price: 1000, rating: 4.0, category: "Burger" },
      { name: "BBQ Burger",           image: "burger/b7.jpeg", price: 705,  rating: 4.3, category: "Burger" },
      { name: "Double Cheeseburger",  image: "burger/b4.jpeg", price: 755,  rating: 4.5, category: "Burger" },
      { name: "Chicken Burger",       image: "burger/b5.jpeg", price: 675,  rating: 4.3, category: "Burger" },
      { name: "Burger King",          image: "burger/b6.jpeg", price: 875,  rating: 4.4, category: "Burger" },
      // Taco
      { name: "Carnitas Taco",   image: "taco/taco1.jpeg", price: 200, rating: 4.7, category: "Taco" },
      { name: "Carne Taco",      image: "taco/taco2.jpeg", price: 250, rating: 4.6, category: "Taco" },
      { name: "Fish Taco",       image: "taco/taco3.jpeg", price: 300, rating: 4.3, category: "Taco" },
      { name: "Chicken Taco",    image: "taco/taco4.jpeg", price: 350, rating: 4.4, category: "Taco" },
      { name: "Barbacoa Taco",   image: "taco/taco5.jpeg", price: 189, rating: 4.6, category: "Taco" },
      { name: "Vegetarian Taco", image: "taco/taco6.jpeg", price: 450, rating: 4.7, category: "Taco" },
      // Pizza
      { name: "Margherita",  image: "pizza/p1.jpeg", price: 1200, rating: 4.6,  category: "Pizza" },
      { name: "Pepperoni",   image: "pizza/p2.jpeg", price: 970,  rating: 4.9,  category: "Pizza" },
      { name: "BBQ Chicken", image: "pizza/p3.jpeg", price: 1000, rating: 4.60, category: "Pizza" },
      { name: "Hawaiian",    image: "pizza/p4.jpeg", price: 1500, rating: 4.4,  category: "Pizza" },
      { name: "Veggie",      image: "pizza/p5.jpeg", price: 900,  rating: 4.8,  category: "Pizza" },
      { name: "Meat Lovers", image: "pizza/p6.jpeg", price: 1200, rating: 4.67, category: "Pizza" },
      { name: "Four Cheese", image: "pizza/p7.jpeg", price: 1900, rating: 4.7,  category: "Pizza" },
    ];

    await Food.insertMany(foods);

    res.json({ success: true, message: "Foods added successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ================= GET ALL FOODS =================
app.get("/api/foods", async (req, res) => {
  try {
    const { category } = req.query;

    const filter = category ? { category } : {};
    const foods = await Food.find(filter);

    res.json({ success: true, foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
export default app;