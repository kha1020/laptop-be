const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const cartRoutes = require("./cartRoutes"); // Import the cart routes

const app = express();
const port = 5000;

// MySQL database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "computer0",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    process.exit(1); // Exit the process if there's an error connecting to DB
  }
  console.log("Connected to MySQL database");
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
// Get all products
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send("Error fetching products");
    }
    res.json(result);
  });
});

// Add a new product
app.post("/api/products", (req, res) => {
  const { name, price, quantity, image, brand } = req.body;
  const query = "INSERT INTO products (name, price, quantity, image, brand) VALUES (?, ?, ?, ?, ?)";

  db.query(query, [name, price, quantity, image, brand], (err, result) => {
    if (err) {
      console.error("Error adding product:", err);
      return res.status(500).send("Error adding product");
    }
    res.json({ id: result.insertId, name, price, quantity, image, brand });
  });
});

// Get a single product by id
app.get("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const query = "SELECT * FROM products WHERE id = ?";

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res.status(500).send("Error fetching product");
    }
    if (result.length > 0) {
      res.json(result[0]); // Send back the first product (only one)
    } else {
      res.status(404).send("Product not found");
    }
  });
});

// Delete a product
app.delete("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const query = "DELETE FROM products WHERE id = ?";

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res.status(500).send("Error deleting product");
    }
    if (result.affectedRows === 0) {
      return res.status(404).send("Product not found");
    }
    res.send("Product deleted");
  });
});

// API để thay đổi trạng thái của đơn hàng
app.put("/api/admin/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Trạng thái mới từ client

  const query = "UPDATE orders SET status = ? WHERE id = ?";
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err);
      return res.status(500).send("Lỗi khi cập nhật trạng thái đơn hàng");
    }
    res.status(200).json({ message: "Trạng thái đơn hàng đã được cập nhật" });
  });
});

// API để xóa đơn hàng
app.delete("/api/admin/orders/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM orders WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Lỗi khi xóa đơn hàng:", err);
      return res.status(500).send("Lỗi khi xóa đơn hàng");
    }
    res.status(200).json({ message: "Đơn hàng đã được xóa" });
  });
});

// API to create an order
app.post("/api/admin/orders", (req, res) => {
  const { totalPrice, shippingInfo, paymentMethod, cart } = req.body;

  // Insert the order into the database
  const query = "INSERT INTO orders (totalPrice, shippingInfo, paymentMethod, cart) VALUES (?, ?, ?, ?)";
  db.query(query, [totalPrice, JSON.stringify(shippingInfo), paymentMethod, JSON.stringify(cart)], (err, result) => {
    if (err) {
      console.error("Error placing order:", err);
      return res.status(500).send("Error placing order");
    }
    res.status(201).json({ message: "Order placed successfully", orderId: result.insertId });
  });
});

// API để lấy tất cả các đơn hàng cho Admin
app.get("/api/admin/orders", (req, res) => {
  const query = "SELECT * FROM orders";  // Truy vấn lấy tất cả các đơn hàng

  db.query(query, (err, result) => {
    if (err) {
      console.error("Lỗi khi lấy đơn hàng:", err);
      return res.status(500).send("Lỗi khi lấy đơn hàng");
    }

    // Định dạng lại kết quả nếu cần (parse dữ liệu nếu cần)
    const orders = result.map(order => ({
      id: order.id,
      totalPrice: order.totalPrice,
      shippingInfo: JSON.parse(order.shippingInfo),  // Parse dữ liệu địa chỉ từ shippingInfo
      paymentMethod: order.paymentMethod,
      cart: JSON.parse(order.cart),  // Parse dữ liệu giỏ hàng từ cart
      createdAt: order.createdAt,  // Thời gian tạo đơn hàng
      status: order.status,  // Thêm cột trạng thái
    }));

    res.status(200).json(orders);  // Trả về danh sách đơn hàng dưới dạng JSON
  });
});

// API để lấy tất cả đơn hàng cho người dùng bình thường (nếu cần)
app.get("/api/orders", (req, res) => {
  const query = "SELECT id, totalPrice, shippingInfo, createdAt, status FROM orders"; // Có thể chỉ trả lại thông tin cần thiết cho người dùng

  db.query(query, (err, result) => {
    if (err) {
      console.error("Lỗi khi lấy đơn hàng:", err);
      return res.status(500).send("Lỗi khi lấy đơn hàng");
    }

    // Định dạng lại kết quả nếu cần
    const orders = result.map(order => ({
      id: order.id,
      totalPrice: order.totalPrice,
      shippingInfo: JSON.parse(order.shippingInfo),
      createdAt: order.createdAt,
      status: order.status,
    }));

    res.status(200).json(orders);  // Trả về danh sách đơn hàng dưới dạng JSON
  });
});

// Use cart routes
app.use("/api/cart", cartRoutes); // Use the cart routes for paths prefixed with /api/cart

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
