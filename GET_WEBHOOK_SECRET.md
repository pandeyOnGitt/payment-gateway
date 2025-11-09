# How to Get Razorpay Webhook Secret

## Step-by-Step Guide

### Step 1: Set up ngrok (if not done already)
```bash
ngrok http 5000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### Step 2: Create Webhook in Razorpay Dashboard

1. **Go to Razorpay Dashboard**
   - Visit: https://dashboard.razorpay.com
   - Login with your account

2. **Navigate to Webhooks**
   - Click on **Settings** (left sidebar)
   - Click on **Webhooks**

3. **Create New Webhook**
   - Click **+ New Webhook** button
   - Fill in the details:
     - **Webhook URL**: `https://your-ngrok-url.ngrok-free.app/verify-payment`
       (Replace with your actual ngrok URL)
     - **Active Events**: Select these events:
       - ✅ `payment.captured`
       - ✅ `payment.failed`
       - ✅ `payment.authorized`
       - ✅ `order.paid`

4. **Click "Create Webhook"**

### Step 3: Get the Webhook Secret

**IMPORTANT**: The webhook secret is shown **ONLY ONCE** when you create the webhook!

After creating the webhook, you'll see a page with:
- Webhook ID
- **Webhook Secret** ← This is what you need!

The secret looks like: `whsec_xxxxxxxxxxxxx`

### Step 4: Update your .env file

Edit `/home/aditya-pandey/Desktop/payment-gateway/backend/.env`:

```bash
# Razorpay Live Configuration
RAZORPAY_KEY_ID=rzp_live_RdZ14jGkcyuvqr
RAZORPAY_KEY_SECRET=hM2Fd9AMDVIW7nrJg5WIAA4J

# Razorpay Webhook Secret (from Dashboard)
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Generic webhook secret (for manual testing, can be any value)
WEBHOOK_SECRET=dev-webhook-secret-12345
```

### Step 5: Restart your backend server

```bash
cd backend
npm start
```

## What Each Secret Does

### `RAZORPAY_WEBHOOK_SECRET`
- **Purpose**: Verifies webhooks sent by Razorpay
- **Source**: Razorpay Dashboard → Settings → Webhooks
- **Format**: `whsec_xxxxxxxxxxxxx`
- **Required**: Yes, for production webhooks

### `WEBHOOK_SECRET`
- **Purpose**: Used for manual payment verification (testing endpoint)
- **Source**: You can set any value
- **Format**: Any string
- **Required**: Only if using `/simulate-payment` endpoint

## If You Lost the Webhook Secret

If you didn't copy the webhook secret when creating the webhook:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Find your webhook
3. Click on it to view details
4. **Note**: The secret is NOT shown again for security reasons
5. **Solution**: You need to delete and recreate the webhook to get a new secret

## Verification

After setting up, test by:
1. Making a test payment
2. Check backend logs for webhook verification
3. Check Razorpay Dashboard → Webhooks → Recent Events to see delivery status

