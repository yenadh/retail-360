"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Edit,
  Eye,
  Loader2,
  Package,
  Search,
  ShoppingCart,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

type OrderCustomer = {
  _id: string;
  fullName: string;
  email: string;
};

type OrderItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Order = {
  _id: string;
  orderNumber: string;
  customerId: OrderCustomer | string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type UpdateForm = {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  notes: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function getCustomerName(order: Order) {
  if (typeof order.customerId === "string") return "Customer";
  return order.customerId?.fullName || "Customer";
}

function getCustomerEmail(order: Order) {
  if (typeof order.customerId === "string") return "";
  return order.customerId?.email || "";
}

function getOrderStatusClass(status: OrderStatus) {
  const classes: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    CONFIRMED: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-purple-50 text-purple-700",
    PACKED: "bg-indigo-50 text-indigo-700",
    DISPATCHED: "bg-orange-50 text-orange-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-red-50 text-red-700",
    RETURNED: "bg-slate-100 text-slate-600",
  };

  return classes[status];
}

function getPaymentStatusClass(status: PaymentStatus) {
  const classes: Record<PaymentStatus, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    PAID: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-red-50 text-red-700",
    REFUNDED: "bg-slate-100 text-slate-600",
  };

  return classes[status];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [form, setForm] = useState<UpdateForm>({
    orderStatus: "PENDING",
    paymentStatus: "PENDING",
    notes: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredOrders = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesSearch =
        !keyword ||
        order.orderNumber.toLowerCase().includes(keyword) ||
        getCustomerName(order).toLowerCase().includes(keyword) ||
        getCustomerEmail(order).toLowerCase().includes(keyword) ||
        order.shippingAddress.phone.toLowerCase().includes(keyword);

      const matchesStatus = !statusFilter || order.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchText, statusFilter]);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (x) => x.orderStatus === "PENDING",
  ).length;
  const deliveredOrders = orders.filter(
    (x) => x.orderStatus === "DELIVERED",
  ).length;
  const totalRevenue = orders
    .filter((x) => x.paymentStatus === "PAID")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<Order[]> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Failed to load orders");
        return;
      }

      setOrders(result.data);
    } catch {
      setError("Something went wrong while loading orders");
    } finally {
      setIsLoading(false);
    }
  }

  function openDetailsModal(order: Order) {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  }

  function closeDetailsModal() {
    setSelectedOrder(null);
    setDetailsModalOpen(false);
  }

  function openUpdateModal(order: Order) {
    setSelectedOrder(order);
    setForm({
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      notes: order.notes || "",
    });
    setUpdateModalOpen(true);
  }

  function closeUpdateModal() {
    if (isSaving) return;

    setSelectedOrder(null);
    setUpdateModalOpen(false);
  }

  async function handleUpdateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedOrder) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result: ApiResponse<Order> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to update order");
        return;
      }

      setMessage(result.message);
      setUpdateModalOpen(false);
      setSelectedOrder(null);

      await loadOrders();
    } catch {
      setError("Something went wrong while updating order");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-purple-50">
              <ClipboardList className="h-4 w-4" />
              Admin Order Management
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">Customer Orders</h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
              View orders, check customer details, update order progress, and
              manage payment status.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={totalOrders}
            description="All order records"
            icon={ShoppingCart}
          />

          <StatCard
            title="Pending"
            value={pendingOrders}
            description="Waiting for action"
            icon={AlertTriangle}
            danger
          />

          <StatCard
            title="Delivered"
            value={deliveredOrders}
            description="Completed orders"
            icon={Truck}
          />

          <StatCard
            title="Revenue"
            valueText={formatCurrency(totalRevenue)}
            description="Paid order value"
            icon={CreditCard}
          />
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              <CheckCircle2 className="h-5 w-5" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertTriangle className="h-5 w-5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-950/5">
          <div className="flex flex-col justify-between gap-4 border-b border-purple-100 p-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Order List</h2>
              <p className="mt-1 text-sm text-slate-500">
                Click a row to view order details.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:w-96">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search order..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="PACKED">Packed</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <OrderTableSkeleton />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <ClipboardList className="h-14 w-14 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No orders found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Orders will appear here after customers checkout.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Order Status</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => openDetailsModal(order)}
                      className="cursor-pointer transition hover:bg-purple-50/40"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.paymentMethod.replaceAll("_", " ")}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {getCustomerName(order)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {getCustomerEmail(order)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {order.items.length} item(s)
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusClass(
                            order.orderStatus,
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusClass(
                            order.paymentStatus,
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetailsModal(order);
                            }}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openUpdateModal(order);
                            }}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] transition hover:bg-purple-100"
                            title="Update"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {detailsModalOpen && selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={closeDetailsModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {updateModalOpen && selectedOrder && (
          <UpdateOrderModal
            order={selectedOrder}
            form={form}
            setForm={setForm}
            isSaving={isSaving}
            onClose={closeUpdateModal}
            onSubmit={handleUpdateOrder}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function StatCard({
  title,
  value,
  valueText,
  description,
  icon: Icon,
  danger = false,
}: {
  title: string;
  value?: number;
  valueText?: string;
  description: string;
  icon: React.ElementType;
  danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2rem] border bg-white p-5 shadow-lg shadow-purple-950/5 ${
        danger ? "border-red-100" : "border-purple-100"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3
            className={`mt-2 text-2xl font-bold ${
              danger ? "text-red-600" : "text-slate-900"
            }`}
          >
            {valueText || value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            danger ? "bg-red-50 text-red-600" : "bg-purple-100 text-[#7C3AED]"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-500">{description}</p>
    </motion.div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close order details overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="fixed left-1/2 top-1/2 z-[90] max-h-[92vh] w-[94%] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-purple-950/30"
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-purple-50">
              <Eye className="h-3.5 w-3.5" />
              Order Details
            </div>

            <h2 className="text-2xl font-bold">{order.orderNumber}</h2>

            <p className="mt-1 text-sm text-purple-100">
              {getCustomerName(order)} • {formatCurrency(order.totalAmount)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 transition hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-112px)] overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-[2rem] border border-purple-100 bg-white p-5">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Ordered Items
                </h3>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.sku}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                          <Package className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.productName}
                          </p>
                          <p className="text-xs text-slate-500">
                            SKU: {item.sku} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(item.totalPrice)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-purple-100 bg-white p-5">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Shipping Address
                </h3>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <p className="font-bold text-slate-900">
                    {order.shippingAddress.fullName}
                  </p>
                  <p>{order.shippingAddress.phone}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>
                    {order.shippingAddress.city}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[2rem] border border-purple-100 bg-purple-50 p-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Order Summary
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <SummaryRow
                    label="Subtotal"
                    value={formatCurrency(order.subtotal)}
                  />
                  <SummaryRow
                    label="Delivery Fee"
                    value={formatCurrency(order.deliveryFee)}
                  />
                  <SummaryRow
                    label="Discount"
                    value={formatCurrency(order.discountAmount)}
                  />

                  <div className="border-t border-purple-200 pt-3">
                    <SummaryRow
                      label="Total"
                      value={formatCurrency(order.totalAmount)}
                      bold
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-purple-100 bg-white p-5">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Status
                </h3>

                <div className="space-y-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusClass(
                      order.orderStatus,
                    )}`}
                  >
                    {order.orderStatus}
                  </span>

                  <br />

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusClass(
                      order.paymentStatus,
                    )}`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="rounded-[2rem] border border-purple-100 bg-white p-5">
                  <h3 className="mb-3 text-lg font-bold text-slate-900">
                    Notes
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className={bold ? "font-bold text-slate-900" : "text-slate-500"}>
        {label}
      </p>
      <p className={bold ? "font-bold text-slate-900" : "text-slate-700"}>
        {value}
      </p>
    </div>
  );
}

function UpdateOrderModal({
  order,
  form,
  setForm,
  isSaving,
  onClose,
  onSubmit,
}: {
  order: Order;
  form: UpdateForm;
  setForm: React.Dispatch<React.SetStateAction<UpdateForm>>;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close update order overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="fixed left-1/2 top-1/2 z-[90] w-[94%] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-purple-950/30"
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white">
          <div>
            <h2 className="text-xl font-bold">Update Order</h2>
            <p className="mt-1 text-sm text-purple-100">{order.orderNumber}</p>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 transition hover:bg-white/25 disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Order Status
              </label>

              <select
                value={form.orderStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    orderStatus: event.target.value as OrderStatus,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="PACKED">Packed</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Status
              </label>

              <select
                value={form.paymentStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    paymentStatus: event.target.value as PaymentStatus,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Notes
            </label>

            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={4}
              placeholder="Add order notes..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Update Order
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function OrderTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="grid animate-pulse grid-cols-8 gap-4 rounded-2xl border border-slate-100 p-4"
        >
          <div className="col-span-2 h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
          <div className="h-10 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
