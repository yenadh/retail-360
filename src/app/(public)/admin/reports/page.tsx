// src/app/admin/reports/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  DollarSign,
  History,
  Loader2,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Customer = {
  _id: string;
  fullName: string;
  email: string;
};

type RecentOrder = {
  _id: string;
  orderNumber: string;
  customerId: Customer | string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
};

type RecentStockMovement = {
  _id: string;
  productId:
    | {
        _id: string;
        name: string;
        sku: string;
      }
    | string;
  movementType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
};

type SummaryReport = {
  sales: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  inventory: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalInventoryValue: number;
    totalStockUnits: number;
  };
  deliveries: {
    totalDeliveries: number;
    pendingDeliveries: number;
    deliveredDeliveries: number;
  };
  recentOrders: RecentOrder[];
  recentStockMovements: RecentStockMovement[];
};

type SalesReport = {
  range: string;
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  averageOrderValue: number;
  salesByDay: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  orderStatusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
};

type InventoryReport = {
  totalProducts: number;
  activeProducts: number;
  totalStockUnits: number;
  totalInventoryValue: number;
  lowStockProducts: {
    _id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    reorderLevel: number;
  }[];
  outOfStockProducts: {
    _id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    reorderLevel: number;
  }[];
  inventoryByCategory: {
    category: string;
    products: number;
    stockUnits: number;
    inventoryValue: number;
  }[];
  recentMovements: RecentStockMovement[];
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

function getCustomerName(order: RecentOrder) {
  if (typeof order.customerId === "string") return "Customer";
  return order.customerId?.fullName || "Customer";
}

function getMovementProductName(movement: RecentStockMovement) {
  if (typeof movement.productId === "string") return "Unknown Product";
  return movement.productId?.name || "Unknown Product";
}

function getMovementProductSku(movement: RecentStockMovement) {
  if (typeof movement.productId === "string") return "";
  return movement.productId?.sku || "";
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

function getMovementClass(type: string) {
  if (type === "STOCK_IN" || type === "RETURN") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (type === "SALE" || type === "STOCK_OUT") {
    return "bg-orange-50 text-orange-700";
  }

  if (type === "DAMAGED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-purple-50 text-purple-700";
}

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] =
    useState<InventoryReport | null>(null);

  const [range, setRange] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [error, setError] = useState("");

  const maxRevenue = useMemo(() => {
    if (!salesReport?.salesByDay.length) return 1;

    return Math.max(...salesReport.salesByDay.map((item) => item.revenue), 1);
  }, [salesReport]);

  async function loadReports() {
    setIsLoading(true);
    setError("");

    try {
      const [summaryResponse, inventoryResponse] = await Promise.all([
        fetch("/api/reports/summary", {
          method: "GET",
          cache: "no-store",
        }),
        fetch("/api/reports/inventory", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const summaryResult: ApiResponse<SummaryReport> =
        await summaryResponse.json();

      const inventoryResult: ApiResponse<InventoryReport> =
        await inventoryResponse.json();

      if (
        !summaryResponse.ok ||
        !summaryResult.success ||
        !summaryResult.data
      ) {
        setError(summaryResult.message || "Failed to load report summary");
        return;
      }

      setSummary(summaryResult.data);

      if (
        inventoryResponse.ok &&
        inventoryResult.success &&
        inventoryResult.data
      ) {
        setInventoryReport(inventoryResult.data);
      }

      await loadSalesReport();
    } catch {
      setError("Something went wrong while loading reports");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSalesReport() {
    setIsSalesLoading(true);

    try {
      const response = await fetch(`/api/reports/sales?range=${range}`, {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<SalesReport> = await response.json();

      if (response.ok && result.success && result.data) {
        setSalesReport(result.data);
      }
    } catch {
      setSalesReport(null);
    } finally {
      setIsSalesLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadReports());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadSalesReport());
  }, [range]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#7C3AED]" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Loading reports...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-purple-50">
                <BarChart3 className="h-4 w-4" />
                Reports & Analytics
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Business Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
                Monitor revenue, orders, inventory value, stock alerts,
                deliveries, and operational performance from one place.
              </p>
            </div>

            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-bold text-[#7C3AED] outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

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

        {summary && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ReportCard
                title="Total Revenue"
                value={formatCurrency(summary.sales.totalRevenue)}
                description="Paid order revenue"
                icon={DollarSign}
              />

              <ReportCard
                title="Total Orders"
                value={`${summary.sales.totalOrders}`}
                description={`${summary.sales.pendingOrders} pending orders`}
                icon={ShoppingCart}
              />

              <ReportCard
                title="Inventory Value"
                value={formatCurrency(summary.inventory.totalInventoryValue)}
                description={`${summary.inventory.totalStockUnits} stock units`}
                icon={Boxes}
              />

              <ReportCard
                title="Low Stock Items"
                value={`${summary.inventory.lowStockProducts}`}
                description={`${summary.inventory.outOfStockProducts} out of stock`}
                icon={AlertTriangle}
                danger
              />
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <MiniStatCard
                title="Delivered Orders"
                value={summary.sales.deliveredOrders}
                icon={CheckCircle2}
              />

              <MiniStatCard
                title="Cancelled Orders"
                value={summary.sales.cancelledOrders}
                icon={AlertTriangle}
                danger
              />

              <MiniStatCard
                title="Delivered Shipments"
                value={summary.deliveries.deliveredDeliveries}
                icon={Truck}
              />
            </div>
          </>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-purple-100 bg-white p-5 shadow-xl shadow-purple-950/5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Sales Trend
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Revenue and order count by day.
                </p>
              </div>

              {isSalesLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-[#7C3AED]" />
              )}
            </div>

            {!salesReport || salesReport.salesByDay.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No sales data"
                text="Sales data will appear after orders are created."
              />
            ) : (
              <div className="space-y-4">
                {salesReport.salesByDay.map((item) => {
                  const width = Math.max(
                    6,
                    Math.round((item.revenue / maxRevenue) * 100),
                  );

                  return (
                    <div key={item.date}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <p className="font-semibold text-slate-700">
                          {item.date}
                        </p>
                        <p className="text-slate-500">
                          {formatCurrency(item.revenue)} • {item.orders} orders
                        </p>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-purple-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-purple-100 bg-white p-5 shadow-xl shadow-purple-950/5">
            <h2 className="text-xl font-bold text-slate-900">Sales Summary</h2>

            {!salesReport ? (
              <EmptyState
                icon={CreditCard}
                title="No sales summary"
                text="No sales report data available."
              />
            ) : (
              <div className="mt-5 grid gap-4">
                <SummaryBlock
                  label="Revenue"
                  value={formatCurrency(salesReport.totalRevenue)}
                  icon={DollarSign}
                />

                <SummaryBlock
                  label="Orders"
                  value={`${salesReport.totalOrders}`}
                  icon={ShoppingCart}
                />

                <SummaryBlock
                  label="Paid Orders"
                  value={`${salesReport.paidOrders}`}
                  icon={CheckCircle2}
                />

                <SummaryBlock
                  label="Average Order Value"
                  value={formatCurrency(salesReport.averageOrderValue)}
                  icon={TrendingUp}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-purple-100 bg-white p-5 shadow-xl shadow-purple-950/5">
            <h2 className="text-xl font-bold text-slate-900">
              Order Status Breakdown
            </h2>

            {salesReport ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.entries(salesReport.orderStatusBreakdown).map(
                  ([key, value]) => (
                    <BreakdownRow key={key} label={key} value={value} />
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No order status data"
                text="Order breakdown will appear after orders are created."
              />
            )}
          </div>

          <div className="rounded-[2rem] border border-purple-100 bg-white p-5 shadow-xl shadow-purple-950/5">
            <h2 className="text-xl font-bold text-slate-900">
              Inventory by Category
            </h2>

            {!inventoryReport ||
            inventoryReport.inventoryByCategory.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No inventory category data"
                text="Category inventory values will appear after products are created."
              />
            ) : (
              <div className="mt-5 space-y-3">
                {inventoryReport.inventoryByCategory.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.category}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.products} products • {item.stockUnits} units
                        </p>
                      </div>

                      <p className="font-bold text-[#7C3AED]">
                        {formatCurrency(item.inventoryValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-950/5">
            <div className="border-b border-purple-100 p-5">
              <h2 className="text-xl font-bold text-slate-900">
                Recent Orders
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest order activity.
              </p>
            </div>

            {!summary || summary.recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No recent orders"
                text="Recent orders will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {getCustomerName(order)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <div className="mt-2 flex justify-end gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(
                            order.orderStatus,
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-950/5">
            <div className="border-b border-purple-100 p-5">
              <h2 className="text-xl font-bold text-slate-900">
                Recent Stock Movements
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest inventory changes.
              </p>
            </div>

            {!summary || summary.recentStockMovements.length === 0 ? (
              <EmptyState
                icon={History}
                title="No stock movements"
                text="Stock movement history will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentStockMovements.map((movement) => (
                  <div key={movement._id} className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-900">
                          {getMovementProductName(movement)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {getMovementProductSku(movement)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getMovementClass(
                          movement.movementType,
                        )}`}
                      >
                        {movement.movementType.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Qty</p>
                        <p className="font-bold text-slate-900">
                          {movement.quantity}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Previous</p>
                        <p className="font-bold text-slate-900">
                          {movement.previousStock}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">New</p>
                        <p className="font-bold text-slate-900">
                          {movement.newStock}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {inventoryReport && inventoryReport.lowStockProducts.length > 0 && (
          <div className="mt-6 rounded-[2rem] border border-red-100 bg-white shadow-xl shadow-purple-950/5">
            <div className="border-b border-red-100 p-5">
              <h2 className="text-xl font-bold text-slate-900">
                Low Stock Alerts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Products that need restocking.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-red-50 text-xs uppercase tracking-wide text-red-600">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Reorder Level</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {inventoryReport.lowStockProducts.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600">
                        {product.stockQuantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {product.reorderLevel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function ReportCard({
  title,
  value,
  description,
  icon: Icon,
  danger = false,
}: {
  title: string;
  value: string;
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3
            className={`mt-2 text-2xl font-bold ${
              danger ? "text-red-600" : "text-slate-900"
            }`}
          >
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
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

function MiniStatCard({
  title,
  value,
  icon: Icon,
  danger = false,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-purple-100 bg-white p-5 shadow-lg shadow-purple-950/5"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            danger ? "bg-red-50 text-red-600" : "bg-purple-100 text-[#7C3AED]"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p
            className={`text-2xl font-bold ${
              danger ? "text-red-600" : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
          <Icon className="h-5 w-5" />
        </div>

        <p className="font-semibold text-slate-700">{label}</p>
      </div>

      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-sm font-semibold capitalize text-slate-700">
        {label.replaceAll("_", " ")}
      </p>

      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-[#7C3AED]">
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <Icon className="h-12 w-12 text-slate-300" />
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{text}</p>
    </div>
  );
}
