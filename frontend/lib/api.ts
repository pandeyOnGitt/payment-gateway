import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  customerId?: string;
  description?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  orderId: string;
  razorpayOrderId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  key: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  orderId: string;
  status: string;
  transactionId: string;
  payment: {
    id: string;
    status: string;
    method: string;
    amount: number;
  };
}

export interface OrderStatus {
  success: boolean;
  order: {
    orderId: string;
    razorpayOrderId?: string;
    amount: number;
    currency: string;
    status: "pending" | "success" | "failed";
    transactionId?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export const paymentApi = {
  createPayment: async (data: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const response = await apiClient.post("/create-payment", data);
    return response.data;
  },

  verifyRazorpayPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post("/verify-razorpay-payment", data);
    return response.data;
  },

  getOrderStatus: async (orderId: string): Promise<OrderStatus> => {
    const response = await apiClient.get(`/order/${orderId}`);
    return response.data;
  },
};

