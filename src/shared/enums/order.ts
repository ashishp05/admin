import type { BookingPaymentStatus, OrderStatus } from "../../models/order";

type ChipColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

export const OrderStatusLabel: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
};

export const OrderStatusColor: Record<OrderStatus, ChipColor> = {
  pending: "warning",
  paid: "success",
  cancelled: "default",
  expired: "default",
  refunded: "secondary",
};

export const OrderStatusOptions = (Object.keys(OrderStatusLabel) as OrderStatus[]).map((value) => ({ value, label: OrderStatusLabel[value] }));

export const BookingPaymentStatusLabel: Record<BookingPaymentStatus, string> = {
  created: "Started",
  captured: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const BookingPaymentStatusOptions = (Object.keys(BookingPaymentStatusLabel) as BookingPaymentStatus[]).map((value) => ({ value, label: BookingPaymentStatusLabel[value] }));

// Razorpay payment methods as shown to staff.
export const PaymentMethodLabel: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  emi: "EMI",
  paylater: "Pay later",
  test: "Test payment",
  upi_qr: "UPI QR",
  credit_card: "Credit card",
  debit_card: "Debit card",
};

export const OrderTitleSuggestions = ["Bat rental", "Tournament entry fee", "Booking balance", "Cafe & snacks", "Coaching session"];

export const OrderExpiryOptions = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];
