"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { paymentApi } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const razorpayOrderId = searchParams.get("razorpayOrderId");
  const amount = searchParams.get("amount");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (!orderId || !razorpayOrderId || !amount) {
      setError("Invalid payment link");
      return;
    }

    // Fetch Razorpay key from order details
    const fetchOrderDetails = async () => {
      try {
        const orderStatus = await paymentApi.getOrderStatus(orderId);
        // We need to get the key from the create-payment response
        // For now, we'll get it from the backend or use env variable
        // The key should be passed in the URL or we can fetch it
      } catch (err) {
        console.error("Error fetching order:", err);
      }
    };

    fetchOrderDetails();
  }, [orderId, razorpayOrderId, amount]);

  const handlePayment = async () => {
    if (!razorpayOrderId || !orderId || !razorpayKey || !window.Razorpay) {
      setError("Payment system not ready. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const options = {
        key: razorpayKey,
        amount: Math.round(parseFloat(amount || "0") * 100), // Convert to paise
        currency: "INR",
        name: "Payment Gateway",
        description: "Payment for services",
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          // Payment successful, verify on backend
          try {
            const verifyResponse = await paymentApi.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId!,
            });

            if (verifyResponse.success && verifyResponse.status === "success") {
              router.push(
                `/payment-success?orderId=${orderId}&transactionId=${verifyResponse.transactionId}`
              );
            } else {
              router.push(
                `/payment-failure?orderId=${orderId}&error=${encodeURIComponent("Payment verification failed")}`
              );
            }
          } catch (verifyError: any) {
            console.error("Verification error:", verifyError);
            router.push(
              `/payment-failure?orderId=${orderId}&error=${encodeURIComponent(
                verifyError.response?.data?.error || "Payment verification failed"
              )}`
            );
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          orderId: orderId,
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError("Payment cancelled by user");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  // Fetch Razorpay key from backend
  useEffect(() => {
    const fetchRazorpayKey = async () => {
      if (!orderId) return;

      try {
        // We need to get the key from the create-payment response
        // Since we don't have it stored, we'll need to either:
        // 1. Pass it in the URL
        // 2. Store it in localStorage
        // 3. Fetch it from backend
        // For now, let's get it from URL or use a separate endpoint
        
        // Check if key is in URL
        const keyFromUrl = searchParams.get("key");
        if (keyFromUrl) {
          setRazorpayKey(keyFromUrl);
        } else {
          // Try to get it from backend - we'll need to add an endpoint or use env
          // For now, we'll use NEXT_PUBLIC_RAZORPAY_KEY if available
          const envKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY;
          if (envKey) {
            setRazorpayKey(envKey);
          } else {
            setError("Razorpay key not found. Please contact support.");
          }
        }
      } catch (err) {
        console.error("Error fetching Razorpay key:", err);
        setError("Failed to load payment system");
      }
    };

    fetchRazorpayKey();
  }, [orderId, searchParams]);

  if (!orderId || !razorpayOrderId || !amount) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Invalid Payment Link
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This payment link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => setError("Failed to load Razorpay SDK")}
      />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Complete Payment
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Order ID: <span className="font-mono text-sm">{orderId}</span>
          </p>
          <div className="mb-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">Amount to pay</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              ₹{parseFloat(amount).toFixed(2)}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || !razorpayLoaded || !razorpayKey}
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : !razorpayLoaded
              ? "Loading Payment Gateway..."
              : `Pay ₹${parseFloat(amount).toFixed(2)}`}
          </button>

          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            🔒 Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </>
  );
}
