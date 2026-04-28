// routes/orderRoutes.js
// ─────────────────────────────────────────────────────────────
//  Order placement API  –  address, tip, delivery, summary
// ─────────────────────────────────────────────────────────────
 
import express from "express";
import mongoose from "mongoose";
 
const router = express.Router();
 
// ================= ORDER SCHEMA =================
const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
 
    // Customer info
    phone:    { type: String, required: true },
    address:  { type: String, required: true },
    landmark: { type: String, default: "" },
 
    // Map coordinates (where to deliver)
    latitude:  { type: Number },
    longitude: { type: Number },
 
    // Order items  [ { foodName, foodPrice, quantity } ]
    items: [
      {
        foodName:  { type: String, required: true },
        foodPrice: { type: Number, required: true },
        quantity:  { type: Number, required: true },
      },
    ],
 
    // Pricing
    subtotal:     { type: Number, required: true },
    deliveryFee:  { type: Number, required: true },
    deliveryTip:  { type: Number, default: 0 },
    platformFee:  { type: Number, default: 14.10 },
    total:        { type: Number, required: true },
 
    // Options
    deliveryType: {
      type: String,
      enum: ["Priority", "Saver", "Standard"],
      default: "Standard",
    },
    orderType: {
      type: String,
      enum: ["Delivery", "Takeaway", "Dine-In", "Curbside Pickup"],
      default: "Delivery",
    },
    paymentMethod: { type: String, default: "Cash" },
    note:          { type: String, default: "" },
 
    // Status tracking (for live map)
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "on_the_way", "delivered"],
      default: "pending",
    },
 
    // Rider's current GPS location (updated by rider app)
    riderLocation: {
      latitude:  { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
  { timestamps: true }
);
 
const OrderModel = mongoose.model("Order", orderSchema);
 
// ================= PLACE ORDER =================
// POST /api/orders/place
router.post("/place", async (req, res) => {
  try {
    const {
      userId, phone, address, landmark,
      latitude, longitude,
      items,
      subtotal, deliveryFee, deliveryTip, platformFee, total,
      deliveryType, orderType, paymentMethod, note,
    } = req.body;
 
    // Basic validation
    if (!userId || !phone || !address || !items?.length) {
      return res.status(400).json({
        success: false,
        message: "userId, phone, address aur items zaruri hain",
      });
    }
 
    const order = new OrderModel({
      userId, phone, address, landmark,
      latitude, longitude,
      items,
      subtotal, deliveryFee,
      deliveryTip: deliveryTip ?? 0,
      platformFee: platformFee ?? 14.10,
      total,
      deliveryType: deliveryType ?? "Standard",
      orderType:    orderType    ?? "Delivery",
      paymentMethod: paymentMethod ?? "Cash",
      note: note ?? "",
    });
 
    await order.save();
 
    return res.status(201).json({
      success: true,
      message: "Order place ho gayi! ✅",
      orderId: order._id,
      order,
    });
 
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
 
// ================= GET ORDER (for tracking) =================
// GET /api/orders/:orderId
router.get("/:orderId", async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order nahi mili" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
 
// ================= GET USER ORDERS =================
// GET /api/orders/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await OrderModel.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
 
// ================= UPDATE STATUS (rider/admin) =================
// PATCH /api/orders/:orderId/status
router.patch("/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "preparing", "on_the_way", "delivered"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
 
    const order = await OrderModel.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
 
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
 
// ================= UPDATE RIDER LOCATION =================
// PATCH /api/orders/:orderId/rider-location
// (Rider app isko call karta rahe GPS update karne ke liye)
router.patch("/:orderId/rider-location", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
 
    const order = await OrderModel.findByIdAndUpdate(
      req.params.orderId,
      { riderLocation: { latitude, longitude } },
      { new: true }
    );
 
    return res.status(200).json({ success: true, riderLocation: order.riderLocation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
 
export default router;
 