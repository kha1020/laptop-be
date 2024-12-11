const express = require("express");
const mysql = require("mysql2");
const router = express.Router();

// MySQL database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "computer0",
});
db.query("SELECT * FROM cart", (err, results) => {
    if (err) {
      console.error("Lỗi kết nối cơ sở dữ liệu:", err);
      return;
    }
    console.log("Dữ liệu trong bảng cart:", results);
  });
  
// Get cart for a specific user
router.get("/", (req, res) => {
  const userId = req.query.userId;

  db.query(
    "SELECT cart.id AS cart_id, cart.quantity, products.id AS product_id, products.name, products.price, products.image, products.brand " +
    "FROM cart INNER JOIN products ON cart.product_id = products.id WHERE cart.user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error fetching cart" });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "No products found in cart" });
      }
      res.json(results);
    }
  );
});

// Add product to cart
router.post("/", (req, res) => {
  const { userId, productId, quantity } = req.body;

  // Check if userId is provided
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  db.query(
    "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
    [userId, productId, quantity, quantity],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error adding product to cart" });
      }
      res.json({ message: "Product added to cart" });
    }
  );
});
router.post('/admin/orders', async (req, res) => {
  try {
    const newOrder = new Order({
      customerName: req.body.shippingInfo.name,
      shippingInfo: req.body.shippingInfo,
      cart: req.body.cart,
      totalPrice: req.body.totalPrice,
      paymentMethod: req.body.paymentMethod,
      status: 'Đã đặt hàng', // Trạng thái mặc định
      createdAt: new Date(),
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Không thể tạo đơn hàng', error });
  }
});

// Update product quantity in cart
router.put("/", (req, res) => {
  const { userId, productId, quantity } = req.body;

  db.query(
    "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
    [quantity, userId, productId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error updating product quantity" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found in cart" });
      }
      res.json({ message: "Product quantity updated" });
    }
  );
});

// Delete product from cart
router.delete("/", (req, res) => {
  const { userId, productId } = req.body;

  db.query(
    "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
    [userId, productId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error deleting product from cart" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found in cart" });
      }
      res.json({ message: "Product removed from cart" });
    }
  );
});

module.exports = router;
