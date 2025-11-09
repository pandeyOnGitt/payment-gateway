"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentFailure() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const error = searchParams.get("error") || "Payment could not be processed";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Payment Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>

        {orderId && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left dark:bg-gray-700/50">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {orderId}
              </span>
            </div>
          </div>
        )}

        <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-left text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <p className="font-semibold mb-2">What to do next:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your card details and try again</li>
            <li>Ensure you have sufficient funds</li>
            <li>Contact your bank if the issue persists</li>
            <li>Contact support if you need assistance</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full rounded-lg bg-indigo-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

