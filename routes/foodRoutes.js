import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// ================= FOOD SCHEMA =================
const foodSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  image:       { type: String, required: true }, // image URL (network se)
  price:       { type: Number, required: true },
  rating:      { type: Number, default: 4.5 },
  category:    { type: String, required: true },
  description: { type: String, default: "" },
}, { timestamps: true });

export const FoodItem = mongoose.model("FoodItem", foodSchema);

// ================= ADD FOOD (Admin only) =================
router.post("/add", async (req, res) => {
  try {
    const { name, image, price, rating, category, description, adminKey } = req.body;

    // Simple admin check
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!name || !image || !price || !category) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const food = new FoodItem({ name, image, price, rating, category, description });
    await food.save();

    return res.status(201).json({ success: true, message: "Food added ✅", food });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ================= GET ALL FOODS =================
router.get("/all", async (req, res) => {
  try {
    const foods = await FoodItem.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, foods });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ================= DELETE FOOD =================
router.delete("/delete/:id", async (req, res) => {
  try {
    const { adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    await FoodItem.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Food deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;