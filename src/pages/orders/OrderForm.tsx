import { Field, Form, Formik, type FormikHelpers } from "formik";
import { toast } from "react-toastify";
import { Button, Input, SelectDropdown, Textarea } from "../../components/ui";
import type { IOrder, IOrderFormModel, IOrderRequest } from "../../models/order";
import { getErrorMessage, getFieldErrors } from "../../services/http-service";
import orderService from "../../services/order-service";
import { OrderExpiryOptions, OrderTitleSuggestions } from "../../shared/enums/order";
import { normalizeMobile } from "../../utils/format";
import { OrderValidationSchema } from "../../validation/order";

interface OrderFormProps {
  // Pre-fill from a booking (e.g. "Create payment link" on a booking).
  initial?: Partial<IOrderFormModel>;
  onOrderCreated: (order: IOrder) => void;
  handleDialogClose: () => void;
}

const emptyForm: IOrderFormModel = {
  title: "",
  description: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  amount: "",
  bookingId: "",
  expiresInDays: "7",
};

const OrderForm = ({ initial, onOrderCreated, handleDialogClose }: OrderFormProps) => {
  const handleSubmit = async (values: IOrderFormModel, helpers: FormikHelpers<IOrderFormModel>) => {
    const body: IOrderRequest = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      customerName: values.customerName.trim(),
      customerPhone: normalizeMobile(values.customerPhone),
      customerEmail: values.customerEmail.trim() || undefined,
      amount: Number(values.amount),
      bookingId: values.bookingId.trim().toUpperCase() || undefined,
      expiresInDays: Number(values.expiresInDays) || 7,
    };
    await orderService
      .createOrder(body)
      .then((response) => {
        toast.success(`Payment link ${response.data.id} created`);
        onOrderCreated(response.data);
      })
      .catch((err) => {
        const fieldErrors = getFieldErrors(err);
        if (Object.keys(fieldErrors).length) helpers.setErrors(fieldErrors);
        else toast.error(getErrorMessage(err));
      });
  };

  return (
    <Formik initialValues={{ ...emptyForm, ...initial }} onSubmit={handleSubmit} validationSchema={OrderValidationSchema} validateOnBlur={false}>
      {({ values, setFieldValue, isSubmitting }) => (
        <Form noValidate className="space-y-4">
          <div>
            <Field name="title" label="Purpose" labelPlacement="outside" placeholder="e.g. Bat rental" isRequired component={Input} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {OrderTitleSuggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFieldValue("title", t)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${values.title === t ? "border-primary bg-primary text-white" : "border-default-200 text-default-700 hover:border-default-400"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Field name="description" label="Note for the customer (optional)" labelPlacement="outside" placeholder="e.g. 2 bats for Saturday's match" component={Textarea} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field name="customerName" label="Customer name" labelPlacement="outside" placeholder="Full name" isRequired component={Input} />
            <Field
              name="customerPhone"
              type="tel"
              label="Mobile number"
              labelPlacement="outside"
              placeholder="10-digit mobile"
              isRequired
              startContent={<span className="text-sm text-default-700">+91</span>}
              component={Input}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              name="amount"
              type="number"
              label="Amount"
              labelPlacement="outside"
              placeholder="e.g. 350"
              isRequired
              startContent={<span className="text-sm text-default-700">₹</span>}
              component={Input}
            />
            <Field name="expiresInDays" label="Link valid for" component={SelectDropdown} options={OrderExpiryOptions} onChange={(v: string | null) => setFieldValue("expiresInDays", v ?? "7")} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field name="customerEmail" type="email" label="Email (optional)" labelPlacement="outside" placeholder="For the receipt" component={Input} />
            <Field
              name="bookingId"
              label="Booking ID (optional)"
              labelPlacement="outside"
              placeholder="e.g. BXK7M2QA"
              inputClassName="font-mono uppercase"
              component={Input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("bookingId", e.target.value.toUpperCase())}
            />
          </div>
          <p className="text-xs text-default-700">
            The customer pays on the booking website with UPI, card, netbanking or a wallet through Razorpay. A linked booking is for reference only: paying the link does not change the booking.
          </p>
          <div className="flex justify-end gap-2 border-t border-default-100 pt-4">
            <Button variant="light" onClick={handleDialogClose}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Create payment link</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default OrderForm;
