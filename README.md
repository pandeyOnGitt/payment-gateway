# Payment Gateway System with Razorpay

A complete payment gateway implementation with React/Next.js frontend and Express backend, integrated with **Razorpay** for secure payment processing, webhook verification, and transaction management.

## 🏗️ Architecture

```
Frontend (Next.js) → Backend (Express) → Payment Processor API
                                          ↓
                                    Webhook → /verify-payment
                                          ↓
                                    Database Update
                                          ↓
                                    Frontend Success/Failure
```

## 📁 Project Structure

```
payment-gateway/
├── backend/
│   ├── server.js          # Express server with payment endpoints
│   ├── database.json      # JSON-based database (auto-generated)
│   ├── package.json
│   └── .env               # Environment variables
├── frontend/
│   ├── app/
│   │   ├── page.tsx       # Checkout page
│   │   ├── pay/
│   │   │   └── page.tsx   # Payment form page
│   │   ├── payment-success/
│   │   │   └── page.tsx   # Success page
│   │   └── payment-failure/
│   │       └── page.tsx   # Failure page
│   ├── lib/
│   │   └── api.ts         # API client
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies (already installed):
```bash
npm install
```

3. Create a `.env` file with Razorpay credentials:
```bash
PORT=5000
FRONTEND_URL=http://localhost:3000
WEBHOOK_SECRET=your-webhook-secret-key-change-this-in-production

# Razorpay Configuration (Get these from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret  # Optional, for webhook verification
```

**Getting Razorpay Credentials:**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings → API Keys
3. Generate test keys (for development) or live keys (for production)
4. Copy the Key ID and Key Secret to your `.env` file

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (already installed):
```bash
npm install
```

3. Create a `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
# Optional: If you want to hardcode Razorpay key (not recommended for production)
# NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_xxxxxxxxxxxxx
```

**Note:** The Razorpay key is automatically passed from the backend, so you typically don't need `NEXT_PUBLIC_RAZORPAY_KEY`.

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔌 API Endpoints

### POST `/create-payment`
Creates a new Razorpay payment order and returns payment details.

**Request:**
```json
{
  "amount": 100,
  "currency": "INR",
  "customerId": "optional",
  "description": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORD-1234567890-abc123",
  "razorpayOrderId": "order_xxxxxxxxxxxxx",
  "paymentUrl": "http://localhost:3000/pay?orderId=...&razorpayOrderId=...",
  "amount": 100,
  "currency": "INR",
  "key": "rzp_test_xxxxxxxxxxxxx"
}
```

### POST `/verify-payment`
Webhook endpoint for Razorpay payment verification (called by Razorpay).

**Razorpay Webhook Format:**
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_hash"
}
```

### POST `/verify-razorpay-payment`
Verify payment from frontend after Razorpay checkout completes.

**Request:**
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_hash",
  "orderId": "ORD-1234567890-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORD-1234567890-abc123",
  "status": "success",
  "transactionId": "pay_xxxxxxxxxxxxx",
  "payment": {
    "id": "pay_xxxxxxxxxxxxx",
    "status": "captured",
    "method": "card",
    "amount": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORD-1234567890-abc123",
  "status": "success",
  "transactionId": "TXN-1234567890-xyz789"
}
```

### GET `/order/:orderId`
Get the status of an order.

**Response:**
```json
{
  "success": true,
  "order": {
    "orderId": "ORD-1234567890-abc123",
    "amount": 100,
    "currency": "USD",
    "status": "success",
    "transactionId": "TXN-1234567890-xyz789",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/transactions`
Get all transactions (for admin dashboard).

### POST `/simulate-payment`
Simulate a payment for testing purposes.

**Request:**
```json
{
  "orderId": "ORD-1234567890-abc123",
  "status": "success" // or "failed"
}
```

## 🔒 Security Features

1. **Webhook Signature Verification**: All webhook requests are verified using HMAC-SHA256 signatures
2. **Input Validation**: All endpoints validate input data
3. **HTTPS/TLS**: Use HTTPS in production (mandatory for PCI DSS compliance)
4. **No Card Storage**: Card data is never stored in the database
5. **Secure Secrets**: Webhook secrets are stored in environment variables

## 🔄 Payment Flow with Razorpay

1. **User clicks "Pay Now"** on the checkout page
2. **Frontend calls** `/create-payment` endpoint
3. **Backend creates** Razorpay order and returns payment details (including Razorpay order ID and key)
4. **User is redirected** to payment page (`/pay`)
5. **Razorpay checkout modal opens** when user clicks "Pay"
6. **User completes payment** using Razorpay's secure checkout (card, UPI, netbanking, etc.)
7. **Razorpay returns** payment response with signature
8. **Frontend calls** `/verify-razorpay-payment` to verify payment signature
9. **Backend verifies** signature and updates order status in database
10. **User is redirected** to success/failure page

## 🧪 Testing with Razorpay

### Test Payment Flow

1. **Set up Razorpay test credentials** in `.env` file
2. Start both backend and frontend servers
3. Navigate to `http://localhost:3000`
4. Enter an amount (e.g., 100 INR)
5. Click "Pay Now"
6. Razorpay checkout modal will open
7. Use Razorpay test cards:
   - **Success**: `4111 1111 1111 1111`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **Name**: Any name
8. Complete the payment
9. You should be redirected to the success page

### Razorpay Test Cards

For testing, use these test card numbers from [Razorpay Test Cards](https://razorpay.com/docs/payments/test-cards/):

- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0000 0000 3220`

### Test Webhook Locally

Use tools like [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 5000
```

Then configure the webhook URL in Razorpay Dashboard:
- Go to Settings → Webhooks
- Add webhook URL: `https://your-ngrok-url.ngrok.io/verify-payment`
- Select events: `payment.captured`, `payment.failed`

## ✅ Razorpay Integration Complete

This project is already integrated with **Razorpay**. The integration includes:

- ✅ Razorpay order creation
- ✅ Razorpay checkout integration
- ✅ Payment signature verification
- ✅ Webhook handling
- ✅ Transaction management

### Switching to Other Processors

If you want to integrate with other payment processors (Stripe, PayPal, etc.), you would need to:

1. Install the processor's SDK
2. Update the `/create-payment` endpoint
3. Update the frontend payment page
4. Update webhook verification logic

The current codebase is structured to make this transition easier.

## 📊 Database

The current implementation uses a JSON file (`database.json`) for simplicity. For production, replace with:

- **PostgreSQL** with Prisma/Sequelize
- **MongoDB** with Mongoose
- **MySQL** with TypeORM

Example with Prisma:
```javascript
// prisma/schema.prisma
model Order {
  id            String   @id @default(uuid())
  orderId       String   @unique
  amount        Float
  currency      String
  status        String
  transactionId String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## 🚨 Production Checklist

- [ ] Replace JSON database with a real database (PostgreSQL/MongoDB)
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure proper CORS settings
- [ ] Set strong webhook secrets
- [ ] Implement rate limiting
- [ ] Add logging and monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Implement PCI DSS compliance measures
- [ ] Add authentication/authorization
- [ ] Set up automated backups
- [ ] Configure environment-specific settings
- [ ] Add comprehensive testing

## 📝 License

ISC

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

