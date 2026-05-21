"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit,
  Eye,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  Plus,
  Search,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type DeliveryStatus =
  | "PENDING"
  | "READY_FOR_DISPATCH"
  | "DISPATCHED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED";

type PopulatedUser = {
  _id: string;
  fullName: string;
  email: string;
};

type PopulatedOrder = {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
};

type Delivery = {
  _id: string;
  orderId: PopulatedOrder | string;
  customerId: PopulatedUser | string;
  deliveryStaffId?: PopulatedUser | string | null;
  trackingNumber: string;
  deliveryStatus: DeliveryStatus;
  deliveryAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  estimatedDeliveryDate: string | null;
  dispatchedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  returnedAt: string | null;
  deliveryNotes: string;
  createdAt: string;
  updatedAt: string;
};

type Order = {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type CreateDeliveryForm = {
  orderId: string;
  deliveryStaffId: string;
  estimatedDeliveryDate: string;
  deliveryNotes: string;
};

type UpdateDeliveryForm = {
  deliveryStaffId: string;
  deliveryStatus: DeliveryStatus;
  estimatedDeliveryDate: string;
  deliveryNotes: string;
};

const initialCreateForm: CreateDeliveryForm = {
  orderId: "",
  deliveryStaffId: "",
  estimatedDeliveryDate: "",
  deliveryNotes: "",
};

const initialUpdateForm: UpdateDeliveryForm = {
  deliveryStaffId: "",
  deliveryStatus: "PENDING",
  estimatedDeliveryDate: "",
  deliveryNotes: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function getOrderNumber(delivery: Delivery) {
  if (typeof delivery.orderId === "string") return "Order";
  return delivery.orderId?.orderNumber || "Order";
}

function getOrderTotal(delivery: Delivery) {
  if (typeof delivery.orderId === "string") return 0;
  return delivery.orderId?.totalAmount || 0;
}

function getCustomerName(delivery: Delivery) {
  if (typeof delivery.customerId === "string") {
    return delivery.deliveryAddress.fullName;
  }

  return delivery.customerId?.fullName || delivery.deliveryAddress.fullName;
}

function getCustomerEmail(delivery: Delivery) {
  if (typeof delivery.customerId === "string") return "";
  return delivery.customerId?.email || "";
}

function getStaffName(delivery: Delivery) {
  if (!delivery.deliveryStaffId) return "Unassigned";
  if (typeof delivery.deliveryStaffId === "string") return "Assigned";
  return delivery.deliveryStaffId?.fullName || "Assigned";
}

function getDeliveryStatusClass(status: DeliveryStatus) {
  const classes: Record<DeliveryStatus, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    READY_FOR_DISPATCH: "bg-blue-50 text-blue-700",
    DISPATCHED: "bg-orange-50 text-orange-700",
    OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-red-50 text-red-700",
    RETURNED: "bg-slate-100 text-slate-600",
  };

  return classes[status];
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString();
}

function toInputDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );

  const [createForm, setCreateForm] =
    useState<CreateDeliveryForm>(initialCreateForm);

  const [updateForm, setUpdateForm] =
    useState<UpdateDeliveryForm>(initialUpdateForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredDeliveries = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    return deliveries.filter((delivery) => {
      const matchesSearch =
        !keyword ||
        delivery.trackingNumber.toLowerCase().includes(keyword) ||
        getOrderNumber(delivery).toLowerCase().includes(keyword) ||
        getCustomerName(delivery).toLowerCase().includes(keyword) ||
        delivery.deliveryAddress.phone.toLowerCase().includes(keyword) ||
        delivery.deliveryAddress.city.toLowerCase().includes(keyword);

      const matchesStatus =
        !statusFilter || delivery.deliveryStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deliveries, searchText, statusFilter]);

  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(
    (item) =>
      item.deliveryStatus === "PENDING" ||
      item.deliveryStatus === "READY_FOR_DISPATCH",
  ).length;
  const dispatchedDeliveries = deliveries.filter(
    (item) =>
      item.deliveryStatus === "DISPATCHED" ||
      item.deliveryStatus === "OUT_FOR_DELIVERY",
  ).length;
  const deliveredDeliveries = deliveries.filter(
    (item) => item.deliveryStatus === "DELIVERED",
  ).length;

  const availableOrders = orders.filter((order) => {
    const alreadyHasDelivery = deliveries.some((delivery) => {
      if (typeof delivery.orderId === "string") {
        return delivery.orderId === order._id;
      }

      return delivery.orderId?._id === order._id;
    });

    return !alreadyHasDelivery && order.orderStatus !== "CANCELLED";
  });

  async function loadInitialData() {
    setIsLoading(true);
    setError("");

    try {
      await Promise.all([loadDeliveries(), loadOrders()]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadInitialData());
  }, []);

  async function loadDeliveries() {
    try {
      const response = await fetch("/api/deliveries", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<Delivery[]> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Failed to load deliveries");
        return;
      }

      setDeliveries(result.data);
    } catch {
      setError("Something went wrong while loading deliveries");
    }
  }

  async function loadOrders() {
    try {
      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<Order[]> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        return;
      }

      setOrders(result.data);
    } catch {
      setOrders([]);
    }
  }

  async function reloadData() {
    await Promise.all([loadDeliveries(), loadOrders()]);
  }

  function openCreateModal() {
    setCreateForm(initialCreateForm);
    setError("");
    setMessage("");
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (isSaving) return;

    setCreateModalOpen(false);
    setCreateForm(initialCreateForm);
  }

  function openDetailsModal(delivery: Delivery) {
    setSelectedDelivery(delivery);
    setDetailsModalOpen(true);
  }

  function closeDetailsModal() {
    setSelectedDelivery(null);
    setDetailsModalOpen(false);
  }

  function openUpdateModal(delivery: Delivery) {
    setSelectedDelivery(delivery);

    setUpdateForm({
      deliveryStaffId:
        delivery.deliveryStaffId && typeof delivery.deliveryStaffId !== "string"
          ? delivery.deliveryStaffId._id
          : "",
      deliveryStatus: delivery.deliveryStatus,
      estimatedDeliveryDate: toInputDate(delivery.estimatedDeliveryDate),
      deliveryNotes: delivery.deliveryNotes || "",
    });

    setUpdateModalOpen(true);
  }

  function closeUpdateModal() {
    if (isSaving) return;

    setSelectedDelivery(null);
    setUpdateModalOpen(false);
  }

  async function handleCreateDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      const result: ApiResponse<Delivery> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to create delivery");
        return;
      }

      setMessage(result.message);
      setCreateModalOpen(false);
      setCreateForm(initialCreateForm);

      await reloadData();
    } catch {
      setError("Something went wrong while creating delivery");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDelivery) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/deliveries/${selectedDelivery._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateForm),
      });

      const result: ApiResponse<Delivery> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to update delivery");
        return;
      }

      setMessage(result.message);
      setUpdateModalOpen(false);
      setSelectedDelivery(null);

      await reloadData();
    } catch {
      setError("Something went wrong while updating delivery");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-purple-50">
                <Truck className="h-4 w-4" />
                Admin Delivery Management
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">Deliveries</h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
                Create delivery records from packed orders, track dispatch
                progress, update delivery status, and manage customer delivery
                details.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              Create Delivery
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Deliveries"
            value={totalDeliveries}
            description="All delivery records"
            icon={Truck}
          />

          <StatCard
            title="Pending"
            value={pendingDeliveries}
            description="Waiting to dispatch"
            icon={AlertTriangle}
            danger
          />

          <StatCard
            title="In Transit"
            value={dispatchedDeliveries}
            description="On delivery route"
            icon={PackageCheck}
          />

          <StatCard
            title="Delivered"
            value={deliveredDeliveries}
            description="Completed deliveries"
            icon={CheckCircle2}
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
              <h2 className="text-xl font-bold text-slate-900">
                Delivery List
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Click a row to view delivery details.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:w-96">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search tracking, order, customer..."
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
                <option value="READY_FOR_DISPATCH">Ready</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <DeliveryTableSkeleton />
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <Truck className="h-14 w-14 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No deliveries found
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Create a delivery after an order is packed and ready for
                dispatch.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Tracking</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Staff</th>
                    <th className="px-6 py-4">Estimated</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDeliveries.map((delivery, index) => (
                    <motion.tr
                      key={delivery._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => openDetailsModal(delivery)}
                      className="cursor-pointer transition hover:bg-purple-50/40"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">
                          {delivery.trackingNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {delivery._id.slice(-8)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {getOrderNumber(delivery)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(getOrderTotal(delivery))}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {getCustomerName(delivery)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {delivery.deliveryAddress.phone}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {delivery.deliveryAddress.city}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getStaffName(delivery)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(delivery.estimatedDeliveryDate)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getDeliveryStatusClass(
                            delivery.deliveryStatus,
                          )}`}
                        >
                          {delivery.deliveryStatus.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetailsModal(delivery);
                            }}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openUpdateModal(delivery);
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
        {createModalOpen && (
          <CreateDeliveryModal
            form={createForm}
            setForm={setCreateForm}
            orders={availableOrders}
            isSaving={isSaving}
            onClose={closeCreateModal}
            onSubmit={handleCreateDelivery}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailsModalOpen && selectedDelivery && (
          <DeliveryDetailsModal
            delivery={selectedDelivery}
            onClose={closeDetailsModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {updateModalOpen && selectedDelivery && (
          <UpdateDeliveryModal
            delivery={selectedDelivery}
            form={updateForm}
            setForm={setUpdateForm}
            isSaving={isSaving}
            onClose={closeUpdateModal}
            onSubmit={handleUpdateDelivery}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  danger = false,
}: {
  title: string;
  value: number;
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
            className={`mt-2 text-3xl font-bold ${
              danger ? "text-red-600" : "text-slate-900"
            }`}
          >
            {value}
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

function CreateDeliveryModal({
  form,
  setForm,
  orders,
  isSaving,
  onClose,
  onSubmit,
}: {
  form: CreateDeliveryForm;
  setForm: React.Dispatch<React.SetStateAction<CreateDeliveryForm>>;
  orders: Order[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close create delivery overlay"
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
            <h2 className="text-xl font-bold">Create Delivery</h2>
            <p className="mt-1 text-sm text-purple-100">
              Create a delivery record from an existing order.
            </p>
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
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Order
            </label>

            <select
              value={form.orderId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  orderId: event.target.value,
                }))
              }
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
            >
              <option value="">Select order</option>
              {orders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.orderNumber} - {formatCurrency(order.totalAmount)} -{" "}
                  {order.shippingAddress.fullName}
                </option>
              ))}
            </select>
          </div>

          <InputField
            label="Estimated Delivery Date"
            type="date"
            value={form.estimatedDeliveryDate}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                estimatedDeliveryDate: value,
              }))
            }
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Delivery Notes
            </label>

            <textarea
              value={form.deliveryNotes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deliveryNotes: event.target.value,
                }))
              }
              rows={4}
              placeholder="Delivery note..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
            />
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-800">
            Creating a delivery will move the order to <b>PACKED</b> status.
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
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Delivery
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function DeliveryDetailsModal({
  delivery,
  onClose,
}: {
  delivery: Delivery;
  onClose: () => void;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close delivery details overlay"
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
              <Truck className="h-3.5 w-3.5" />
              Delivery Details
            </div>

            <h2 className="text-2xl font-bold">{delivery.trackingNumber}</h2>

            <p className="mt-1 text-sm text-purple-100">
              {getOrderNumber(delivery)} • {getCustomerName(delivery)}
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
                  Delivery Address
                </h3>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <p className="font-bold text-slate-900">
                    {delivery.deliveryAddress.fullName}
                  </p>
                  <p>{delivery.deliveryAddress.phone}</p>
                  <p>{delivery.deliveryAddress.address}</p>
                  <p>
                    {delivery.deliveryAddress.city}{" "}
                    {delivery.deliveryAddress.postalCode}
                  </p>
                  <p>{delivery.deliveryAddress.country}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={ClipboardList}
                  title="Order Number"
                  value={getOrderNumber(delivery)}
                />

                <InfoCard
                  icon={UserRound}
                  title="Customer"
                  value={getCustomerName(delivery)}
                  subValue={getCustomerEmail(delivery)}
                />

                <InfoCard
                  icon={Phone}
                  title="Phone"
                  value={delivery.deliveryAddress.phone}
                />

                <InfoCard
                  icon={MapPin}
                  title="City"
                  value={delivery.deliveryAddress.city}
                />

                <InfoCard
                  icon={CalendarDays}
                  title="Estimated Delivery"
                  value={formatDate(delivery.estimatedDeliveryDate)}
                />

                <InfoCard
                  icon={Truck}
                  title="Delivery Staff"
                  value={getStaffName(delivery)}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[2rem] border border-purple-100 bg-purple-50 p-5">
                <h3 className="text-lg font-bold text-slate-900">Status</h3>

                <div className="mt-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getDeliveryStatusClass(
                      delivery.deliveryStatus,
                    )}`}
                  >
                    {delivery.deliveryStatus.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              <div className="rounded-[2rem] border border-purple-100 bg-white p-5">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Timeline
                </h3>

                <div className="space-y-3 text-sm text-slate-600">
                  <TimelineRow
                    label="Created"
                    value={formatDate(delivery.createdAt)}
                  />
                  <TimelineRow
                    label="Dispatched"
                    value={formatDate(delivery.dispatchedAt)}
                  />
                  <TimelineRow
                    label="Out for Delivery"
                    value={formatDate(delivery.outForDeliveryAt)}
                  />
                  <TimelineRow
                    label="Delivered"
                    value={formatDate(delivery.deliveredAt)}
                  />
                  <TimelineRow
                    label="Failed"
                    value={formatDate(delivery.failedAt)}
                  />
                  <TimelineRow
                    label="Returned"
                    value={formatDate(delivery.returnedAt)}
                  />
                </div>
              </div>

              {delivery.deliveryNotes && (
                <div className="rounded-[2rem] border border-purple-100 bg-white p-5">
                  <h3 className="mb-3 text-lg font-bold text-slate-900">
                    Notes
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    {delivery.deliveryNotes}
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

function UpdateDeliveryModal({
  delivery,
  form,
  setForm,
  isSaving,
  onClose,
  onSubmit,
}: {
  delivery: Delivery;
  form: UpdateDeliveryForm;
  setForm: React.Dispatch<React.SetStateAction<UpdateDeliveryForm>>;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close update delivery overlay"
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
            <h2 className="text-xl font-bold">Update Delivery</h2>
            <p className="mt-1 text-sm text-purple-100">
              {delivery.trackingNumber}
            </p>
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
                Delivery Status
              </label>

              <select
                value={form.deliveryStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deliveryStatus: event.target.value as DeliveryStatus,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              >
                <option value="PENDING">Pending</option>
                <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>

            <InputField
              label="Estimated Delivery Date"
              type="date"
              value={form.estimatedDeliveryDate}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  estimatedDeliveryDate: value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Delivery Notes
            </label>

            <textarea
              value={form.deliveryNotes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deliveryNotes: event.target.value,
                }))
              }
              rows={4}
              placeholder="Delivery update note..."
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
                  Update Delivery
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  subValue,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-purple-100 bg-white p-4 shadow-sm shadow-purple-950/5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-900">
        {value}
      </p>

      {subValue && <p className="mt-1 text-xs text-slate-500">{subValue}</p>}
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <p className="font-semibold text-slate-600">{label}</p>
      <p className="text-slate-500">{value}</p>
    </div>
  );
}

function DeliveryTableSkeleton() {
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
