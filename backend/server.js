import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Database file path (simple JSON-based storage for demo)
const DB_PATH = path.join(__dirname, "database.json");

// Initialize database if it doesn't exist
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      orders: [],
      transactions: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Read database
function readDatabase() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    initDatabase();
    return { orders: [], transactions: [] };
  }
}

// Write database
function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Generate secure hash for webhook verification
function generateSignature(data, secret) {
  const payload = JSON.stringify(data);
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Verify webhook signature
function verifySignature(data, signature, secret) {
  const expectedSignature = generateSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Verify Razorpay webhook signature
function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const text = orderId + "|" + paymentId;
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");
  return generatedSignature === signature;
}

// Initialize database on startup
initDatabase();

// Step 1: Create payment endpoint
app.post("/create-payment", async (req, res) => {
  try {
    const { amount, currency = "INR", customerId, description } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        error: "Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables." 
      });
    }

    // Generate unique order ID for our system
    const internalOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency: currency,
      receipt: internalOrderId,
      notes: {
        description: description || "Payment",
        customerId: customerId || null,
      },
    });

    // Create order record in our database
    const order = {
      orderId: internalOrderId,
      razorpayOrderId: razorpayOrder.id,
      amount: parseFloat(amount),
      currency: currency,
      customerId: customerId || null,
      description: description || "Payment",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database
    const db = readDatabase();
    db.orders.push(order);
    writeDatabase(db);

    // Return Razorpay order details for frontend
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    res.json({
      success: true,
      orderId: internalOrderId,
      razorpayOrderId: razorpayOrder.id,
      amount: parseFloat(amount),
      currency: currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentUrl: `${baseUrl}/pay?orderId=${internalOrderId}&razorpayOrderId=${razorpayOrder.id}&amount=${amount}`,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ 
      error: error.message || "Internal server error",
      details: error.error?.description || "Failed to create Razorpay order"
    });
  }
});

// Step 2: Handle payment verification (webhook endpoint for Razorpay)
app.post("/verify-payment", async (req, res) => {
  try {
    // Razorpay webhook format
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Also support manual verification format
    const { orderId, status, transactionId, signature, amount } = req.body;

    // Handle Razorpay webhook
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
      
      // Verify Razorpay signature
      const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        webhookSecret
      );

      if (!isValid) {
        return res.status(401).json({ error: "Invalid Razorpay signature" });
      }

      // Find order by Razorpay order ID
      const db = readDatabase();
      const orderIndex = db.orders.findIndex((o) => o.razorpayOrderId === razorpay_order_id);

      if (orderIndex === -1) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Fetch payment details from Razorpay
      try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const order = db.orders[orderIndex];
        
        // Update order status based on payment status
        order.status = payment.status === "captured" || payment.status === "authorized" ? "success" : "failed";
        order.transactionId = razorpay_payment_id;
        order.razorpayPaymentId = razorpay_payment_id;
        order.updatedAt = new Date().toISOString();

        // Create transaction record
        const transaction = {
          transactionId: razorpay_payment_id,
          orderId: order.orderId,
          razorpayOrderId: razorpay_order_id,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          paymentMethod: payment.method || null,
          createdAt: new Date().toISOString(),
        };

        db.transactions.push(transaction);
        writeDatabase(db);

        return res.json({
          success: true,
          orderId: order.orderId,
          status: order.status,
          transactionId: razorpay_payment_id,
        });
      } catch (razorpayError) {
        console.error("Error fetching payment from Razorpay:", razorpayError);
        return res.status(500).json({ error: "Failed to verify payment with Razorpay" });
      }
    }

    // Handle manual verification (for testing or direct API calls)
    if (orderId && transactionId) {
      // Validate required fields
      if (!orderId || !status || !transactionId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify webhook signature
      const webhookSecret = process.env.WEBHOOK_SECRET || "your-webhook-secret";
      if (signature) {
        const isValid = verifySignature(
          { orderId, status, transactionId, amount },
          signature,
          webhookSecret
        );
        if (!isValid) {
          return res.status(401).json({ error: "Invalid signature" });
        }
      }

      // Update order status in database
      const db = readDatabase();
      const orderIndex = db.orders.findIndex((o) => o.orderId === orderId);

      if (orderIndex === -1) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order
      const order = db.orders[orderIndex];
      order.status = status; // 'success', 'failed', 'pending'
      order.transactionId = transactionId;
      order.updatedAt = new Date().toISOString();

      // Create transaction record
      const transaction = {
        transactionId,
        orderId,
        amount: order.amount,
        currency: order.currency,
        status,
        createdAt: new Date().toISOString(),
      };

      db.transactions.push(transaction);
      writeDatabase(db);

      return res.json({
        success: true,
        orderId,
        status,
        transactionId,
      });
    }

    return res.status(400).json({ error: "Invalid request format" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify payment after Razorpay checkout (called from frontend)
app.post("/verify-razorpay-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay payment details" });
    }

    // Verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      webhookSecret
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid payment signature" });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    // Find order
    const db = readDatabase();
    const orderIndex = db.orders.findIndex(
      (o) => o.razorpayOrderId === razorpay_order_id || o.orderId === orderId
    );

    if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = db.orders[orderIndex];
    
    // Update order status
    order.status = payment.status === "captured" || payment.status === "authorized" ? "success" : "failed";
    order.transactionId = razorpay_payment_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.updatedAt = new Date().toISOString();

    // Create transaction record if not exists
    const existingTransaction = db.transactions.find(
      (t) => t.transactionId === razorpay_payment_id
    );

    if (!existingTransaction) {
      const transaction = {
        transactionId: razorpay_payment_id,
        orderId: order.orderId,
        razorpayOrderId: razorpay_order_id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        paymentMethod: payment.method || null,
        createdAt: new Date().toISOString(),
      };
      db.transactions.push(transaction);
    }

    writeDatabase(db);

    res.json({
      success: true,
      orderId: order.orderId,
      status: order.status,
      transactionId: razorpay_payment_id,
      payment: {
        id: payment.id,
        status: payment.status,
        method: payment.method,
        amount: payment.amount / 100, // Convert from paise
      },
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ 
      error: "Failed to verify payment",
      details: error.message 
    });
  }
});

// Get order status
app.get("/order/:orderId", (req, res) => {
  try {
    const { orderId } = req.params;
    const db = readDatabase();
    const order = db.orders.find((o) => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all transactions (for admin dashboard)
app.get("/transactions", (req, res) => {
  try {
    const db = readDatabase();
    res.json({ success: true, transactions: db.transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Simulate payment processor webhook (for testing)
app.post("/simulate-payment", async (req, res) => {
  try {
    const { orderId, status = "success" } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID required" });
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get order to get amount
    const db = readDatabase();
    const order = db.orders.find((o) => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Generate signature
    const webhookSecret = process.env.WEBHOOK_SECRET || "your-webhook-secret";
    const signature = generateSignature(
      { orderId, status, transactionId, amount: order.amount },
      webhookSecret
    );

    // Update order status directly (simulating webhook)
    order.status = status;
    order.transactionId = transactionId;
    order.updatedAt = new Date().toISOString();

    // Create transaction record
    const transaction = {
      transactionId,
      orderId,
      amount: order.amount,
      currency: order.currency,
      status,
      createdAt: new Date().toISOString(),
    };

    db.transactions.push(transaction);
    writeDatabase(db);

    res.json({
      success: true,
      message: "Payment simulated",
      orderId,
      status,
      transactionId,
    });
  } catch (error) {
    console.error("Error simulating payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Payment Gateway Server running on port ${PORT}`);
  console.log(`💳 Payment Processor: Razorpay`);
  console.log(`📝 API Endpoints:`);
  console.log(`   POST /create-payment - Create a new Razorpay payment order`);
  console.log(`   POST /verify-payment - Verify payment (Razorpay webhook)`);
  console.log(`   POST /verify-razorpay-payment - Verify payment from frontend`);
  console.log(`   GET  /order/:orderId - Get order status`);
  console.log(`   GET  /transactions - Get all transactions`);
  console.log(`   POST /simulate-payment - Simulate payment (testing)`);
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log(`⚠️  WARNING: Razorpay credentials not configured!`);
    console.log(`   Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file`);
  }
});

