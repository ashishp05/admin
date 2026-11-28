import * as Yup from "yup";
import { RegularExpression } from "../../shared/constants/regular-expression";

// Mirrors the backend rules for POST /admin/orders.
export const OrderValidationSchema = Yup.object({
  title: Yup.string().trim().required("Purpose is required").min(2, "At least 2 characters").max(80, "At most 80 characters"),
  description: Yup.string().trim().max(300, "At most 300 characters"),
  customerName: Yup.string().trim().required("Customer name is required").min(2, "At least 2 characters").max(80, "At most 80 characters"),
  customerPhone: Yup.string()
    .trim()
    .required("Mobile number is required")
    .transform((value: string) => value.replace(/\D/g, "").slice(-10))
    .matches(RegularExpression.IndianMobile, "Enter a valid 10-digit mobile number"),
  customerEmail: Yup.string().trim().matches(RegularExpression.Email, { message: "Enter a valid email", excludeEmptyString: true }),
  amount: Yup.number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Enter an amount")
    .required("Amount is required")
    .min(1, "At least ₹1")
    .max(500000, "At most ₹5,00,000")
    .test("paise", "At most 2 decimals", (value) => value === undefined || Math.round(value * 100) === value * 100),
  bookingId: Yup.string().trim().max(20, "Check the booking ID"),
  expiresInDays: Yup.number().required().min(1).max(30),
});
