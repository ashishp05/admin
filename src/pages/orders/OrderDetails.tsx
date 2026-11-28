import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FaChevronLeft, FaWhatsapp } from "react-icons/fa";
import { FiCopy, FiExternalLink, FiRotateCcw, FiXCircle } from "react-icons/fi";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Card, CardBody, Chip, Modal, Skeleton } from "../../components/ui";
import type { IOrder } from "../../models/order";
import { Routing } from "../../routes/routing";
import { getErrorMessage } from "../../services/http-service";
import orderService from "../../services/order-service";
import { OrderStatusColor, OrderStatusLabel, PaymentMethodLabel } from "../../shared/enums/order";
import { StaffRoles } from "../../shared/enums/user";
import type { IApplicationState } from "../../store/state/app-state";
import { dateTimeIST, formatRupees, phoneText } from "../../utils/format";
import FormAlert from "../account/components/FormAlert";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-default-100 py-2.5 last:border-0">
    <dt className="shrink-0 text-sm text-default-700">{label}</dt>
    <dd className="text-right text-sm font-medium text-foreground">{children}</dd>
  </div>
);

const whatsappText = (order: IOrder) =>
  `Hi ${order.customerName.split(" ")[0]}, please pay ${formatRupees(order.amount)} for "${order.title}" at The Riverside Cricket Box: ${order.payUrl}`;

const OrderDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const state = location.state as { id?: string; justCreated?: boolean } | null;
  const id = state?.id ?? params.get("id") ?? "";
  const isAdmin = useSelector((s: IApplicationState) => s.UserData.role === StaffRoles.Admin);
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<"cancel" | "refund" | null>(null);
  const [busy, setBusy] = useState(false);

  const getOrder = useCallback(async () => {
    if (!id) return;
    await orderService
      .getOrderDetails(id)
      .then((response) => setOrder(response.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getOrder();
  }, [getOrder]);

  // While unpaid, check for the payment every few seconds so the page turns Paid by itself.
  useEffect(() => {
    if (order?.status !== "pending") return undefined;
    const timer = window.setInterval(getOrder, 5000);
    return () => window.clearInterval(timer);
  }, [order?.status, getOrder]);

  const copyLink = async () => {
    if (!order) return;
    await navigator.clipboard
      .writeText(order.payUrl)
      .then(() => toast.success("Payment link copied"))
      .catch(() => toast.info(order.payUrl));
  };

  const runAction = async () => {
    if (!order || !confirm) return;
    setBusy(true);
    const request = confirm === "cancel" ? orderService.cancelOrder(order.id) : orderService.refundOrder(order.id);
    await request
      .then((response) => {
        setOrder(response.data);
        toast.success(confirm === "cancel" ? "Payment link cancelled" : `${formatRupees(response.data.amount)} refund started`);
        setConfirm(null);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setBusy(false));
  };

  if (!id) {
    return (
      <section className="py-20 text-center">
        <p className="text-default-700">No order selected.</p>
        <Link to={Routing.AllOrders} className="font-semibold text-primary hover:underline">Go to orders</Link>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <button type="button" onClick={() => navigate(Routing.AllOrders)} className="inline-flex items-center gap-2 text-sm font-medium text-default-700 hover:text-primary">
        <FaChevronLeft className="h-3 w-3" aria-hidden /> Orders
      </button>

      {loading || !order ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : (
        <>
          {state?.justCreated && order.status === "pending" && (
            <FormAlert tone="success">Payment link created. Share it with {order.customerName} by WhatsApp or let them scan the QR code.</FormAlert>
          )}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{order.title}</h1>
                <Chip size="md" variant="dot" color={OrderStatusColor[order.status]}>
                  {OrderStatusLabel[order.status]}
                </Chip>
              </div>
              <p className="mt-1 font-mono text-sm text-default-700">{order.id}</p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-foreground">{formatRupees(order.amount)}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card shadow="sm" fullWidth>
                <CardBody className="p-5">
                  <h2 className="mb-2 text-base font-semibold text-foreground">Customer</h2>
                  <dl>
                    <Row label="Name">{order.customerName}</Row>
                    <Row label="Mobile">
                      <a href={`tel:+91${order.customerPhone}`} className="text-primary hover:underline">{phoneText(order.customerPhone)}</a>
                    </Row>
                    {order.customerEmail && <Row label="Email">{order.customerEmail}</Row>}
                    {order.description && <Row label="Note">{order.description}</Row>}
                    {order.bookingId && (
                      <Row label="Booking">
                        <button type="button" className="font-mono text-primary hover:underline" onClick={() => navigate(Routing.BookingDetails, { state: { id: order.bookingId } })}>
                          {order.bookingId}
                        </button>
                      </Row>
                    )}
                  </dl>
                </CardBody>
              </Card>

              <Card shadow="sm" fullWidth>
                <CardBody className="p-5">
                  <h2 className="mb-2 text-base font-semibold text-foreground">Payment</h2>
                  {order.status === "pending" && order.failureReason && (
                    <div className="mb-3">
                      <FormAlert tone="warning">Last attempt failed: {order.failureReason}. The customer can try again with the same link.</FormAlert>
                    </div>
                  )}
                  <dl>
                    <Row label="Status">{OrderStatusLabel[order.status]}</Row>
                    <Row label="Amount">{formatRupees(order.amount)}</Row>
                    {order.paymentMethod && <Row label="Paid with">{PaymentMethodLabel[order.paymentMethod] ?? order.paymentMethod}</Row>}
                    {order.paidAt && <Row label="Paid on">{dateTimeIST(order.paidAt)}</Row>}
                    {order.status === "pending" && <Row label="Link expires">{dateTimeIST(order.expiresAt)}</Row>}
                    {order.cancelledAt && <Row label="Cancelled on">{dateTimeIST(order.cancelledAt)}</Row>}
                    {order.refundedAt && <Row label="Refunded on">{dateTimeIST(order.refundedAt)}</Row>}
                    {order.razorpayOrderId && <Row label="Razorpay order"><span className="font-mono text-xs">{order.razorpayOrderId}</span></Row>}
                    {order.razorpayPaymentId && <Row label="Razorpay payment"><span className="font-mono text-xs">{order.razorpayPaymentId}</span></Row>}
                    {order.refundId && <Row label="Refund ID"><span className="font-mono text-xs">{order.refundId}</span></Row>}
                    <Row label="Created">
                      {dateTimeIST(order.createdAt)}
                      {order.createdBy ? ` · ${order.createdBy.name}` : ""}
                    </Row>
                  </dl>
                  {order.status === "paid" && order.refundedAt === null && (
                    <p className="mt-3 text-xs text-default-700">Refunds go back to the customer's original payment method in 5–7 working days.</p>
                  )}
                </CardBody>
              </Card>
            </div>

            <Card shadow="sm" fullWidth className="self-start">
              <CardBody className="flex flex-col items-center gap-4 p-5 text-center">
                {order.status === "pending" ? (
                  <>
                    <h2 className="text-base font-semibold text-foreground">Share the payment link</h2>
                    <div className="rounded-xl border border-default-200 bg-white p-3">
                      <QRCodeSVG value={order.payUrl} size={168} />
                    </div>
                    <p className="break-all font-mono text-xs text-default-700">{order.payUrl}</p>
                    <div className="grid w-full grid-cols-2 gap-2">
                      <Button variant="bordered" startContent={<FiCopy className="h-4 w-4" />} onClick={copyLink}>
                        Copy link
                      </Button>
                      <Button
                        variant="bordered"
                        startContent={<FaWhatsapp className="h-4 w-4" />}
                        onClick={() => window.open(`https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(whatsappText(order))}`, "_blank", "noopener")}
                      >
                        WhatsApp
                      </Button>
                    </div>
                    <a href={order.payUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      <FiExternalLink className="h-4 w-4" aria-hidden /> Open pay page
                    </a>
                    <p className="text-xs text-default-700">This page updates by itself when the customer pays.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-semibold text-foreground">{OrderStatusLabel[order.status]}</h2>
                    <p className="text-sm text-default-700">
                      {order.status === "paid"
                        ? `${order.customerName} paid ${formatRupees(order.amount)}${order.paidAt ? ` on ${dateTimeIST(order.paidAt)}` : ""}.`
                        : order.status === "refunded"
                          ? `${formatRupees(order.amount)} was refunded to ${order.customerName}.`
                          : "This link can no longer be paid. Create a new order if the customer still needs to pay."}
                    </p>
                  </>
                )}

                {order.status === "pending" && (
                  <Button variant="light" color="danger" startContent={<FiXCircle className="h-4 w-4" />} onClick={() => setConfirm("cancel")}>
                    Cancel link
                  </Button>
                )}
                {order.status === "paid" && isAdmin && (
                  <Button variant="bordered" color="danger" startContent={<FiRotateCcw className="h-4 w-4" />} onClick={() => setConfirm("refund")}>
                    Refund {formatRupees(order.amount)}
                  </Button>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      <Modal openDialog={!!confirm} handleDialogClose={() => setConfirm(null)} title={confirm === "refund" ? "Refund this payment?" : "Cancel this payment link?"} size="md">
        {order && confirm && (
          <div className="space-y-4">
            <p className="text-sm text-default-700">
              {confirm === "refund"
                ? `${formatRupees(order.amount)} goes back to ${order.customerName}'s original payment method through Razorpay. This cannot be undone.`
                : `${order.customerName} will no longer be able to pay this link.`}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="light" onClick={() => setConfirm(null)}>Keep</Button>
              <Button color="danger" isLoading={busy} onClick={runAction}>
                {confirm === "refund" ? "Refund" : "Cancel link"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default OrderDetails;
