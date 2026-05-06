// src/app/my-orders/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  Loader2,
  Package,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    CONFIRMED: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-purple-50 text-purple-700",
    PACKED: "bg-indigo-50 text-indigo-700",
    DISPATCHED: "bg-orange-50 text-orange-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-red-50 text-red-700",
    RETURNED: "bg-slate-100 text-slate-600",
    PAID: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-red-50 text-red-700",
    REFUNDED: "bg-slate-100 text-slate-600",
  };

  return map[status] || "bg-slate-100 text-slate-600";
}

export default function MyOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.push("/login?redirect=/my-orders");
        return;
      }

      const result: ApiResponse<Order[]> = await response.json();

      if (response.ok && result.success && result.data) {
        setOrders(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <h1 className="text-3xl font-bold sm:text-4xl">My Orders</h1>
          <p className="mt-3 text-sm text-purple-100">
            View your order history and current order status.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#7C3AED]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[2rem] border border-purple-100 bg-white p-12 text-center shadow-lg shadow-purple-950/5">
            <ClipboardList className="mx-auto h-14 w-14 text-slate-300" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No orders yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your orders will appear here after checkout.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-950/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Order Status</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="transition hover:bg-purple-50/40"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.paymentMethod.replaceAll("_", " ")}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {order.items.length} item(s)
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            order.orderStatus,
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
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
                        <div className="flex justify-end">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </main>
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
        className="fixed left-1/2 top-1/2 z-[90] max-h-[90vh] w-[94%] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-purple-950/30"
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white">
          <div>
            <h2 className="text-xl font-bold">{order.orderNumber}</h2>
            <p className="mt-1 text-sm text-purple-100">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-6">
          <h3 className="mb-4 font-bold text-slate-900">Items</h3>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={`${item.productId}-${item.sku}`}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
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

                <p className="font-bold text-slate-900">
                  {formatCurrency(item.totalPrice)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-purple-50 p-5">
            <h3 className="font-bold text-slate-900">Delivery Address</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.phone}
              <br />
              {order.shippingAddress.address}
              <br />
              {order.shippingAddress.city} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
