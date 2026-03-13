// const express = require("express");
// const Stripe = require("stripe");
// const cors = require("cors");
// const mysql = require("mysql2/promise");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// require("dotenv").config();

// // Initialize Express
// const app = express();

// // Initialize Stripe with secret key
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// if (!process.env.STRIPE_SECRET_KEY || !process.env.DB_HOST) {
//     console.error("Missing required environment variables.");
//     throw new Error("Missing required environment variables.");
// }

// // Database Connection Pool
// const db = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Change to a strong secret

// // Helper function for authentication middleware
// function authenticate(req, res, next) {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).send({ error: "Unauthorized" });

//     jwt.verify(token, SECRET_KEY, (err, user) => {
//         if (err) return res.status(403).send({ error: "Forbidden" });
//         req.user = user;
//         next();
//     });
// }

// // Route to create a Checkout Session
// app.post("/create-checkout-session", async (req, res) => {
//     const { cart, currency } = req.body;

//     if (!cart || !Array.isArray(cart)) {
//         return res.status(400).send({ error: "Invalid cart data." });
//     }

//     try {
//         const lineItems = cart.map((item) => ({
//             price_data: {
//                 currency: currency || "usd",
//                 product_data: {
//                     name: item.title,
//                     description: item.description,
//                     images: [item.image],
//                 },
//                 unit_amount: Math.round(item.price * 100),
//             },
//             quantity: item.quantity,
//         }));

//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ["card"],
//             line_items: lineItems,
//             mode: "payment",
//             success_url: "http://localhost:3000/checkout-success",
//             cancel_url: "http://localhost:3000/checkout-cancel",
//         });

//         // Save order details to database
//         const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
//         const [result] = await db.query(
//             "INSERT INTO orders (session_id, total_price, status, created_at) VALUES (?, ?, ?, NOW())",
//             [session.id, totalPrice, "pending"]
//         );

//         console.log(`Order saved with ID: ${result.insertId}`);
//         res.send({ url: session.url });
//     } catch (error) {
//         console.error("Error creating checkout session:", error);
//         res.status(500).send({ error: error.message });
//     }
// });

// // Route to create a Payment Intent
// app.post("/create-payment-intent", async (req, res) => {
//     const { amount, currency } = req.body;

//     if (!amount || isNaN(amount)) {
//         return res.status(400).send({ error: "Invalid amount provided." });
//     }

//     try {
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount,
//             currency: currency || "usd",
//             automatic_payment_methods: { enabled: true },
//         });

//         res.send({ clientSecret: paymentIntent.client_secret });
//     } catch (error) {
//         console.error("Error creating payment intent:", error);
//         res.status(500).send({ error: error.message });
//     }
// });

// // Route to fetch Payment Details
// app.get("/payment-details", async (req, res) => {
//     const { paymentIntentId } = req.query;

//     console.log("Fetching payment details for PaymentIntent ID:", paymentIntentId);

//     if (!paymentIntentId) {
//         return res.status(400).send({ error: "PaymentIntent ID is required." });
//     }

//     try {
//         const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//         if (!paymentIntent) {
//             return res.status(404).send({ error: "PaymentIntent not found." });
//         }

//         console.log("Successfully retrieved PaymentIntent:", paymentIntent);

//         // Update database with payment details
//         await db.query(
//             "UPDATE orders SET status = ?, updated_at = NOW() WHERE session_id = ?",
//             [paymentIntent.status, paymentIntent.id]
//         );

//         res.send({
//             id: paymentIntent.id,
//             amount: paymentIntent.amount,
//             currency: paymentIntent.currency,
//             status: paymentIntent.status,
//             receipt_email: paymentIntent.receipt_email,
//         });
//     } catch (error) {
//         console.error("Error fetching payment details:", error.message);
//         res.status(500).send({ error: error.message });
//     }
// });

// // Route: Register a New Admin User
// app.post("/admin/register", async (req, res) => {
//     const { username, password } = req.body;

//     if (!username || !password) {
//         return res.status(400).send({ error: "Username and password are required." });
//     }

//     try {
//         const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
//         await db.query(
//             "INSERT INTO users (username, password_hash) VALUES (?, ?)",
//             [username, hashedPassword]
//         );
//         res.send({ message: "Admin user registered successfully." });
//     } catch (error) {
//         console.error("Error registering user:", error.message);
//         res.status(500).send({ error: "Internal server error" });
//     }
// });

// // Route: Login for Admin User
// app.post("/admin/login", async (req, res) => {
//     const { username, password } = req.body;

//     if (!username || !password) {
//         return res.status(400).send({ error: "Username and password are required." });
//     }

//     try {
//         const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

//         if (rows.length === 0) {
//             return res.status(401).send({ error: "Invalid username or password." });
//         }

//         const user = rows[0];
//         const isMatch = await bcrypt.compare(password, user.password_hash);

//         if (!isMatch) {
//             return res.status(401).send({ error: "Invalid username or password." });
//         }

//         const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
//         res.send({ message: "Login successful", token });
//     } catch (error) {
//         console.error("Error during login:", error.message);
//         res.status(500).send({ error: "Internal server error" });
//     }
// });

// // Route: Fetch All Orders (Admin Access)
// app.get("/admin/orders", authenticate, async (req, res) => {
//     try {
//         const [rows] = await db.query("SELECT * FROM orders ORDER BY created_at DESC");
//         res.send(rows);
//     } catch (error) {
//         console.error("Error fetching orders:", error.message);
//         res.status(500).send({ error: "Internal server error" });
//     }
// });

// // Default Route
// app.get("/", (req, res) => {
//     res.send("Stripe Server with Database and Admin Features is running...");
// });

// // Start the server
// const PORT = process.env.PORT || 4242;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

