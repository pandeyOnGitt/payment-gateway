"use client";

import { useState } from "react";
import { paymentApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Checkout() {
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePay = async () => {
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.createPayment({
        amount,
        currency: "INR",
        description: "Payment for services",
      });

      // Redirect to payment page with Razorpay key
      const paymentUrl = new URL(response.paymentUrl);
      paymentUrl.searchParams.set("key", response.key);
      window.location.href = paymentUrl.toString();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create payment");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Checkout
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Enter the amount you want to pay
        </p>

        <div className="mb-6">
          <label
            htmlFor="amount"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Amount (INR)
          </label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(parseFloat(e.target.value) || 0);
              setError(null);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Enter amount"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading || amount <= 0}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Secure payment processing
        </p>
      </div>
    </div>
  );
}
