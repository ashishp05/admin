import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Field, Form, Formik } from "formik";
import { debounce } from "lodash";
import { FaSearch } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { TanstackTable } from "../../components/custom-table/TanstackTable";
import { Card, CardBody, Chip, Input, SelectDropdown } from "../../components/ui";
import type { Pagination } from "../../models/base-type";
import type { BookingPaymentStatus, IBookingPayment } from "../../models/order";
import { Routing } from "../../routes/routing";
import orderService from "../../services/order-service";
import { PAGINATION } from "../../shared/constants/pagination";
import { PaymentRecordColor } from "../../shared/enums/booking";
import { BookingPaymentStatusLabel, BookingPaymentStatusOptions, PaymentMethodLabel } from "../../shared/enums/order";
import { handleTableLoader } from "../../store/slices/generalSlice";
import { dateTimeIST, formatRupees, phoneText, shortDate, slotRange } from "../../utils/format";

// Every Razorpay order created for a booking (customer site and counter UPI/card).
const BookingPaymentsTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BookingPaymentStatus | "">("");
  const [pagination, setPagination] = useState<Pagination>(PAGINATION);
  const [records, setRecords] = useState<IBookingPayment[]>([]);
  const [total, setTotal] = useState(0);

  const getPayments = useCallback(
    async (term: string, st: BookingPaymentStatus | "", page: number, limit: number) => {
      dispatch(handleTableLoader(true));
      await orderService
        .getBookingPayments({ search: term, status: st, limit, skip: (page - 1) * limit })
        .then((result) => {
          setRecords(result.items);
          setTotal(result.total);
        })
        .catch(() => undefined)
        .finally(() => dispatch(handleTableLoader(false)));
    },
    [dispatch],
  );

  useEffect(() => {
    getPayments("", "", PAGINATION.page, PAGINATION.limit);
  }, [getPayments]);

  const debouncedSearch = useMemo(() => debounce((term: string, st: BookingPaymentStatus | "", limit: number) => getPayments(term, st, 1, limit), 400), [getPayments]);
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const columns: ColumnDef<IBookingPayment>[] = useMemo(
    () => [
      { accessorKey: "createdAt", header: "Started", cell: ({ row }) => <span className="whitespace-nowrap text-sm">{dateTimeIST(row.original.createdAt)}</span> },
      {
        accessorKey: "bookingId",
        header: "Booking",
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="font-mono text-sm font-semibold text-primary">{row.original.bookingId}</p>
            <p className="text-xs text-default-700">
              {shortDate(row.original.date)} · {slotRange(row.original.startHour, row.original.hours)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="font-medium">{row.original.customerName}</p>
            <p className="text-xs text-default-700">{phoneText(row.original.customerPhone)}</p>
          </div>
        ),
      },
      { accessorKey: "amount", header: "Amount", meta: { align: "right" }, cell: ({ row }) => <span className="font-semibold tabular-nums">{formatRupees(row.original.amount)}</span> },
      { accessorKey: "method", header: "Method", cell: ({ row }) => <span className="text-sm">{PaymentMethodLabel[row.original.method] ?? row.original.method}</span> },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Chip size="sm" variant="dot" color={PaymentRecordColor[row.original.status]}>
            {BookingPaymentStatusLabel[row.original.status]}
          </Chip>
        ),
      },
      {
        accessorKey: "orderId",
        header: "Razorpay",
        cell: ({ row }) => (
          <div className="font-mono text-xs text-default-700">
            <p>{row.original.orderId}</p>
            {row.original.paymentId && <p>{row.original.paymentId}</p>}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="w-full space-y-4">
      <Formik initialValues={{ search, status }} enableReinitialize onSubmit={() => undefined}>
        <Form noValidate className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by booking ID, customer, mobile or Razorpay ID"
              value={search}
              isClearable
              startContent={<FaSearch className="h-4 w-4" aria-hidden />}
              onChange={(e) => {
                const value = e?.target ? e.target.value : "";
                setSearch(value);
                setPagination((p) => ({ ...p, page: 1 }));
                debouncedSearch(value, status, pagination.limit);
              }}
            />
          </div>
          <Field
            name="status"
            placeholder="All statuses"
            component={SelectDropdown}
            isClearable
            options={BookingPaymentStatusOptions}
            onChange={(v: string | null) => {
              const next = (v ?? "") as BookingPaymentStatus | "";
              setStatus(next);
              setPagination((p) => ({ ...p, page: 1 }));
              getPayments(search, next, 1, pagination.limit);
            }}
          />
        </Form>
      </Formik>
      <Card shadow="sm" fullWidth>
        <CardBody className="p-0">
          {records.length === 0 && total === 0 ? (
            <p className="py-12 text-center text-default-700">{search || status ? "No payments match these filters." : "No online booking payments yet."}</p>
          ) : (
            <TanstackTable
              data={records}
              columns={columns}
              enablePagination
              manualPagination
              pagination={pagination}
              totalCount={total}
              onPaginationChange={(next) => {
                if (next.page === pagination.page && next.limit === pagination.limit) return;
                setPagination(next);
                getPayments(search, status, next.page, next.limit);
              }}
              onRowClick={(row) => navigate(Routing.BookingDetails, { state: { id: row.bookingId } })}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default BookingPaymentsTab;
