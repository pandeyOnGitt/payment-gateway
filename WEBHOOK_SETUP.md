# Razorpay Webhook Setup Guide

## Overview
Razorpay requires an HTTPS URL for webhooks. Since you're developing locally, you need to expose your local server using a tunneling service.

## Option 1: Using ngrok (Recommended)

### Step 1: Install ngrok

**Linux:**
```bash
# Download ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz

# Extract
tar -xzf ngrok-v3-stable-linux-amd64.tgz

# Move to /usr/local/bin (optional, for system-wide access)
sudo mv ngrok /usr/local/bin/

# Or just use it from current directory
./ngrok
```

**Or use snap:**
```bash
sudo snap install ngrok
```

**macOS:**
```bash
brew install ngrok
```

**Windows:**
Download from: https://ngrok.com/download

### Step 2: Sign up for ngrok (Free)
1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account
3. Get your authtoken from the dashboard

### Step 3: Configure ngrok
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 4: Start your backend server
```bash
cd backend
npm start
```

### Step 5: Start ngrok tunnel
In a **new terminal**, run:
```bash
ngrok http 5000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

### Step 6: Configure Webhook in Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **Webhooks**
3. Click **+ New Webhook**
4. Enter the following:
   - **Webhook URL**: `https://abc123.ngrok-free.app/verify-payment`
     (Replace `abc123.ngrok-free.app` with your ngrok URL)
   - **Active Events**: Select these events:
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `payment.authorized`
     - ✅ `order.paid`
5. Click **Create Webhook**
6. **Copy the Webhook Secret** - You'll see it only once!
7. Update your `.env` file:
   ```bash
   RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Step 7: Restart your backend server
```bash
cd backend
npm start
```

## Option 2: Using Cloudflare Tunnel (Free, No Signup)

### Install cloudflared
```bash
# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# macOS
brew install cloudflared
```

### Start tunnel
```bash
cloudflared tunnel --url http://localhost:5000
```

You'll get an HTTPS URL like: `https://random-subdomain.trycloudflare.com`

Use this URL in Razorpay webhook configuration.

## Option 3: Using localtunnel (Free, No Signup)

### Install localtunnel
```bash
npm install -g localtunnel
```

### Start tunnel
```bash
lt --port 5000
```

You'll get an HTTPS URL like: `https://random-subdomain.loca.lt`

## Option 4: Deploy to Production

For production, deploy your backend to a service that provides HTTPS:

- **Vercel** (for serverless)
- **Railway**
- **Render**
- **Heroku**
- **AWS/Google Cloud/Azure**
- **DigitalOcean**

Then use your production URL: `https://yourdomain.com/verify-payment`

## Webhook Endpoint Details

**Endpoint URL**: `https://your-domain.com/verify-payment`

**Method**: POST

**Expected Payload** (from Razorpay):
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_hash"
}
```

## Testing Webhooks

### Test Webhook Locally

1. Start your backend server
2. Start ngrok tunnel
3. Configure webhook in Razorpay dashboard
4. Make a test payment
5. Check your backend logs for webhook events

### Test Webhook with Razorpay CLI (Optional)

Razorpay provides a CLI tool to test webhooks:
```bash
npm install -g razorpay-cli
razorpay webhook test --url https://your-ngrok-url.ngrok-free.app/verify-payment
```

## Important Notes

1. **Webhook Secret**: Keep it secure and never commit it to git
2. **HTTPS Required**: Razorpay only sends webhooks to HTTPS URLs
3. **Idempotency**: Your webhook handler should be idempotent (handle duplicate events)
4. **Timeout**: Razorpay expects a response within 5 seconds
5. **Retry Logic**: Razorpay retries failed webhooks automatically

## Troubleshooting

### Webhook not receiving events?
- Check if your backend server is running
- Verify ngrok tunnel is active
- Check Razorpay dashboard → Webhooks → Recent Events
- Check backend logs for errors

### Signature verification failing?
- Ensure `RAZORPAY_WEBHOOK_SECRET` is set correctly in `.env`
- Restart your backend server after updating `.env`
- Verify the webhook secret matches the one in Razorpay dashboard

### ngrok URL changes every time?
- Use ngrok's free static domain feature (requires account)
- Or upgrade to ngrok paid plan for static domains
- Or use a production deployment with a fixed domain

## Quick Start Script

Create a file `start-with-ngrok.sh`:

```bash
#!/bin/bash

# Start backend in background
cd backend && npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start ngrok
ngrok http 5000

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
```

Make it executable:
```bash
chmod +x start-with-ngrok.sh
```

Run it:
```bash
./start-with-ngrok.sh
```

