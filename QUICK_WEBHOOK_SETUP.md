# Quick Webhook Setup Guide

## Step 1: Get ngrok Authtoken (One-time setup)

1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account (it's free!)
3. After signing up, go to: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your authtoken (looks like: `2abc123def456ghi789jkl012mno345pq_6r7s8t9u0v1w2x3y4z5`)

## Step 2: Configure ngrok

Run this command (replace with your actual authtoken):
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

## Step 3: Start your backend server

In one terminal:
```bash
cd /home/aditya-pandey/Desktop/payment-gateway/backend
npm start
```

Wait until you see: `🚀 Payment Gateway Server running on port 5000`

## Step 4: Start ngrok tunnel

In another terminal, run:
```bash
cd /home/aditya-pandey/Desktop/payment-gateway
./start-ngrok.sh
```

Or manually:
```bash
ngrok http 5000
```

You'll see output like:
```
Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:5000
```

**Copy the HTTPS URL** (e.g., `https://abc123def456.ngrok-free.app`)

## Step 5: Configure Webhook in Razorpay Dashboard

1. Go to https://dashboard.razorpay.com
2. Navigate to **Settings** → **Webhooks**
3. Click **+ New Webhook**
4. Fill in:
   - **Webhook URL**: `https://abc123def456.ngrok-free.app/verify-payment`
     (Replace with your actual ngrok URL)
   - **Active Events**: Select these:
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `payment.authorized`
     - ✅ `order.paid`
5. Click **Create Webhook**
6. **IMPORTANT**: Copy the **Webhook Secret** (you'll see it only once!)
   - It looks like: `whsec_xxxxxxxxxxxxx`

## Step 6: Update your .env file

Edit `/home/aditya-pandey/Desktop/payment-gateway/backend/.env`:

```bash
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

(Replace with the secret you copied from Razorpay)

## Step 7: Restart your backend

Stop the backend (Ctrl+C) and restart:
```bash
cd backend
npm start
```

## ✅ Done!

Your webhook is now configured. When payments are made:
1. Razorpay will send webhook events to your ngrok URL
2. Your backend will receive and verify them
3. Order status will be updated automatically

## Testing

1. Make a test payment on your frontend
2. Check your backend logs for webhook events
3. Check Razorpay Dashboard → Webhooks → Recent Events to see webhook delivery status

## Important Notes

- **Keep ngrok running**: The tunnel must stay active for webhooks to work
- **URL changes**: Free ngrok URLs change each time you restart. For a fixed URL, upgrade to ngrok paid plan or deploy to production
- **Webhook Secret**: Keep it secure, never share it publicly

## Troubleshooting

**Webhook not working?**
- Make sure ngrok is running
- Make sure backend is running on port 5000
- Check Razorpay Dashboard → Webhooks → Recent Events for delivery status
- Check backend logs for errors

**Signature verification failing?**
- Double-check `RAZORPAY_WEBHOOK_SECRET` in `.env` file
- Make sure you restarted the backend after updating `.env`
- The secret should start with `whsec_`

