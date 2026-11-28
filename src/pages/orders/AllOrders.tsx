import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Field, Form, Formik } from "formik";
import { debounce } from "lodash";
import { FaSearch } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { TanstackTable } from "../../components/custom-table/TanstackTable";
import { Button, Card, CardBody, Chip, Input, Modal, SelectDropdown, Tabs } from "../../components/ui";
import type { Pagination } from "../../models/base-type";
import type { IOrder, IOrderFilter, OrderStatus } from "../../models/order";
import { Routing } from "../../routes/routing";
import orderService from "../../services/order-service";
import { PAGINATION } from "../../shared/constants/pagination";
import { OrderStatusColor, OrderStatusLabel, OrderStatusOptions } from "../../shared/enums/order";
import { handleTableLoader } from "../../store/slices/generalSlice";
import { dateTimeIST, formatRupees, phoneText } from "../../utils/format";
import BookingPaymentsTab from "./BookingPaymentsTab";
import OrderForm from "./OrderForm";

const initialFilter: IOrderFilter = { status: "", search: "" };

const PaymentLinksTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<IOrderFilter>(initialFilter);
  const [pagination, setPagination] = useState<Pagination>(PAGINATION);
  const [records, setRecords] = useState<IOrder[]>([]);
  const [total, setTotal] = useState(0);

  const getOrders = useCallback(
    async (current: IOrderFilter, page: number, limit: number) => {
      dispatch(handleTableLoader(true));
      await orderService
        .getAllOrders({ ...current, limit, skip: (page - 1) * limit })
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
    getOrders(initialFilter, PAGINATION.page, PAGINATION.limit);
  }, [getOrders]);

  const debouncedSearch = useMemo(() => debounce((next: IOrderFilter, limit: number) => getOrders(next, 1, limit), 400), [getOrders]);
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const apply = (patch: Partial<IOrderFilter>, slow = false) => {
    const next = { ...filter, ...patch };
    setFilter(next);
    setPagination((p) => ({ ...p, page: 1 }));
    if (slow) debouncedSearch(next, pagination.limit);
    else getOrders(next, 1, pagination.limit);
  };

  const columns: ColumnDef<IOrder>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Payment link",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="font-medium">{row.original.title}</p>
            <p className="font-mono text-xs text-default-700">
              {row.original.id}
              {row.original.bookingId ? ` · ${row.original.bookingId}` : ""}
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
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div>
            <Chip size="sm" variant="dot" color={OrderStatusColor[row.original.status]}>
              {OrderStatusLabel[row.original.status]}
            </Chip>
            {row.original.status === "pending" && row.original.failureReason && <p className="mt-1 max-w-[180px] truncate text-xs text-danger">{row.original.failureReason}</p>}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <div className="whitespace-nowrap text-sm">
            <p>{dateTimeIST(row.original.createdAt)}</p>
            <p className="text-xs text-default-700">{row.original.createdBy?.name ?? ""}</p>
          </div>
        ),
      },
      {
        accessorKey: "paidAt",
        header: "Paid / expires",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">
            {row.original.paidAt ? dateTimeIST(row.original.paidAt) : row.original.status === "pending" ? `Until ${dateTimeIST(row.original.expiresAt)}` : "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="w-full space-y-4">
      <Formik initialValues={filter} enableReinitialize onSubmit={() => undefined}>
        <Form noValidate className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by link ID, booking ID, purpose, customer or mobile"
              value={filter.search}
              isClearable
              startContent={<FaSearch className="h-4 w-4" aria-hidden />}
              onChange={(e) => apply({ search: e?.target ? e.target.value : "" }, true)}
            />
          </div>
          <Field name="status" placeholder="All statuses" component={SelectDropdown} isClearable options={OrderStatusOptions} onChange={(v: string | null) => apply({ status: (v ?? "") as OrderStatus | "" })} />
        </Form>
      </Formik>
      <Card shadow="sm" fullWidth>
        <CardBody className="p-0">
          {records.length === 0 && total === 0 ? (
            <p className="py-12 text-center text-default-700">{filter.search || filter.status ? "No payment links match these filters." : "No payment links yet. Create one to collect a payment online."}</p>
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
                getOrders(filter, next.page, next.limit);
              }}
              onRowClick={(row) => navigate(Routing.OrderDetails, { state: { id: row.id } })}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};

const AllOrders = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("links");
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-default-700">Create a payment link for any amount and share it. The customer pays online through Razorpay and the link turns Paid by itself.</p>
        </div>
        <Button startContent={<FiPlus className="h-4 w-4" />} onClick={() => setOpenDialog(true)}>
          Create order
        </Button>
      </div>

      <Tabs
        variant="underlined"
        selectedKey={tab}
        onSelectionChange={setTab}
        items={[
          { id: "links", label: "Payment links", content: <PaymentLinksTab /> },
          { id: "bookings", label: "Booking payments", content: <BookingPaymentsTab /> },
        ]}
      />

      <Modal openDialog={openDialog} handleDialogClose={() => setOpenDialog(false)} title="Create payment link" size="2xl" backdrop="blur" scrollBehavior="inside">
        {openDialog && (
          <OrderForm
            handleDialogClose={() => setOpenDialog(false)}
            onOrderCreated={(order) => {
              setOpenDialog(false);
              navigate(Routing.OrderDetails, { state: { id: order.id, justCreated: true } });
            }}
          />
        )}
      </Modal>
    </section>
  );
};

export default AllOrders;
