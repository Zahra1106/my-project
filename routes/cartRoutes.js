// routes/cartRoutes.js

import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// ================= CART SCHEMA =================
const cartItemSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  foodName:  { type: String, required: true },
  foodPrice: { type: Number, required: true },
  foodImage: { type: String },
  quantity:  { type: Number, default: 1 },
  note:      { type: String, default: "" },
});

const CartItemModel = mongoose.model("CartItem", cartItemSchema);

// ================= ADD TO CART =================
router.post("/add", async (req, res) => {
  try {
    const { userId, foodName, foodPrice, foodImage, quantity, note } = req.body;

    if (!userId || !foodName || !foodPrice) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Agar same item already hai to quantity badhao
    const existing = await CartItemModel.findOne({ userId, foodName });

    if (existing) {
      existing.quantity += quantity ?? 1;
      existing.note = note ?? existing.note;
      await existing.save();
      return res.status(200).json({ success: true, message: "Quantity updated", cart: existing });
    }

    const newItem = new CartItemModel({ userId, foodName, foodPrice, foodImage, quantity: quantity ?? 1, note });
    await newItem.save();

    return res.status(201).json({ success: true, message: "Item added to cart ✅", cart: newItem });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ================= GET CART =================
router.get("/:userId", async (req, res) => {
  try {
    const items = await CartItemModel.find({ userId: req.params.userId });
    return res.status(200).json({ success: true, cart: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ================= REMOVE ITEM =================
router.delete("/remove/:id", async (req, res) => {
  try {
    await CartItemModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Item removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;