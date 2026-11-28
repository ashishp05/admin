export type OrderStatus = "pending" | "paid" | "cancelled" | "expired" | "refunded";

// Payment link (Order management). Money in rupees.
export interface IOrder {
    id: string;
    title: string;
    description: string | null;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    amount: number;
    status: OrderStatus;
    bookingId: string | null;
    payUrl: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    paymentMethod: string | null;
    failureReason: string | null;
    refundId: string | null;
    expiresAt: string;
    paidAt: string | null;
    cancelledAt: string | null;
    refundedAt: string | null;
    createdBy: { id: string; name: string } | null;
    createdAt: string;
}

export interface IOrderRequest {
    title: string;
    description?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    amount: number;
    bookingId?: string;
    expiresInDays: number;
}

export interface IOrderFormModel {
    title: string;
    description: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    amount: number | "";
    bookingId: string;
    expiresInDays: string;
}

export interface IOrderFilter {
    status: OrderStatus | "";
    search: string;
}

export type BookingPaymentStatus = "created" | "captured" | "failed" | "refunded";

// A Razorpay order created for a booking.
export interface IBookingPayment {
    id: string;
    bookingId: string;
    orderId: string;
    paymentId: string | null;
    status: BookingPaymentStatus;
    amount: number;
    method: string;
    refundId: string | null;
    customerName: string;
    customerPhone: string;
    date: string;
    startHour: number;
    hours: number;
    createdAt: string;
}
