"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  History,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
};

type ProductSupplier = {
  _id: string;
  name: string;
};

type InventoryProduct = {
  _id: string;
  name: string;
  sku: string;
  categoryId: ProductCategory | string;
  supplierId?: ProductSupplier | string | null;
  price: number;
  stockQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  batchNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type StockMovement = {
  _id: string;
  productId:
    | {
        _id: string;
        name: string;
        sku: string;
      }
    | string;
  movementType:
    | "STOCK_IN"
    | "STOCK_OUT"
    | "SALE"
    | "RETURN"
    | "ADJUSTMENT"
    | "DAMAGED"
    | "CANCELLED_ORDER_RESTOCK";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceType: string;
  batchNumber: string;
  createdAt: string;
};

type InventorySummary = {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
};

type InventoryResponse = {
  summary: InventorySummary;
  items: InventoryProduct[];
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type MovementFormState = {
  productId: string;
  movementType: "STOCK_IN" | "STOCK_OUT" | "RETURN" | "ADJUSTMENT" | "DAMAGED";
  quantity: string;
  reason: string;
  referenceType: "SUPPLIER" | "MANUAL" | "RETURN" | "DAMAGE";
  batchNumber: string;
};

const initialMovementForm: MovementFormState = {
  productId: "",
  movementType: "STOCK_IN",
  quantity: "1",
  reason: "",
  referenceType: "MANUAL",
  batchNumber: "",
};

function getCategoryName(product: InventoryProduct) {
  if (typeof product.categoryId === "string") return "Unknown";
  return product.categoryId?.name || "Unknown";
}

function getSupplierName(product: InventoryProduct) {
  if (!product.supplierId) return "No supplier";
  if (typeof product.supplierId === "string") return "No supplier";
  return product.supplierId?.name || "No supplier";
}

function getMovementProductName(movement: StockMovement) {
  if (typeof movement.productId === "string") return "Unknown product";
  return movement.productId.name;
}

function getMovementProductSku(movement: StockMovement) {
  if (typeof movement.productId === "string") return "";
  return movement.productId.sku;
}

function getMovementLabel(type: string) {
  const labels: Record<string, string> = {
    STOCK_IN: "Stock In",
    STOCK_OUT: "Stock Out",
    SALE: "Sale",
    RETURN: "Return",
    ADJUSTMENT: "Adjustment",
    DAMAGED: "Damaged",
    CANCELLED_ORDER_RESTOCK: "Cancelled Restock",
  };

  return labels[type] || type;
}

function getMovementIcon(type: string) {
  if (
    type === "STOCK_IN" ||
    type === "RETURN" ||
    type === "CANCELLED_ORDER_RESTOCK"
  ) {
    return ArrowUpCircle;
  }

  if (type === "STOCK_OUT" || type === "SALE" || type === "DAMAGED") {
    return ArrowDownCircle;
  }

  return SlidersHorizontal;
}

function getMovementColor(type: string) {
  if (
    type === "STOCK_IN" ||
    type === "RETURN" ||
    type === "CANCELLED_ORDER_RESTOCK"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (type === "DAMAGED") {
    return "bg-red-50 text-red-700";
  }

  if (type === "STOCK_OUT" || type === "SALE") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-purple-50 text-[#7C3AED]";
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });

  const [searchText, setSearchText] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isMovementLoading, setIsMovementLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [form, setForm] = useState<MovementFormState>(initialMovementForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword) ||
        product.batchNumber.toLowerCase().includes(keyword) ||
        getCategoryName(product).toLowerCase().includes(keyword) ||
        getSupplierName(product).toLowerCase().includes(keyword)
      );
    });
  }, [products, searchText]);

  async function loadInitialData() {
    setIsLoading(true);
    setError("");

    try {
      await Promise.all([loadInventory(), loadMovements()]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadInitialData());
  }, []);

  async function loadInventory() {
    try {
      const query = new URLSearchParams();

      if (stockFilter) {
        query.set("stockStatus", stockFilter);
      }

      const response = await fetch(`/api/inventory?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<InventoryResponse> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Failed to load inventory");
        return;
      }

      setSummary(result.data.summary);
      setProducts(result.data.items);
    } catch {
      setError("Something went wrong while loading inventory");
    }
  }

  async function loadMovements() {
    setIsMovementLoading(true);

    try {
      const response = await fetch("/api/inventory/movements", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<StockMovement[]> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        return;
      }

      setMovements(result.data);
    } catch {
      setMovements([]);
    } finally {
      setIsMovementLoading(false);
    }
  }

  async function reloadInventoryAndMovements() {
    await Promise.all([loadInventory(), loadMovements()]);
  }

  useEffect(() => {
    loadInventory();
  }, [stockFilter]);

  function openMovementModal(product?: InventoryProduct) {
    setForm({
      ...initialMovementForm,
      productId: product?._id || "",
      batchNumber: product?.batchNumber || "",
    });
    setError("");
    setMessage("");
    setMovementModalOpen(true);
  }

  function closeMovementModal() {
    if (isSaving) return;

    setMovementModalOpen(false);
    setForm(initialMovementForm);
  }

  async function handleCreateMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
        }),
      });

      const result: ApiResponse<StockMovement> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to record stock movement");
        return;
      }

      setMessage(result.message);
      setMovementModalOpen(false);
      setForm(initialMovementForm);

      await reloadInventoryAndMovements();
    } catch {
      setError("Something went wrong while recording stock movement");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-purple-50">
                <Boxes className="h-4 w-4" />
                Admin Inventory Management
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Inventory Control
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
                Track stock levels, record stock movements, manage low stock
                alerts, and maintain inventory traceability.
              </p>
            </div>

            <button
              onClick={() => openMovementModal()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              Record Stock Movement
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Products"
            value={summary.totalProducts}
            description="Inventory products"
            icon={Package}
          />

          <StatCard
            title="Total Stock"
            value={summary.totalStock}
            description="Available units"
            icon={Boxes}
          />

          <StatCard
            title="Low Stock"
            value={summary.lowStockItems}
            description="Needs attention"
            icon={AlertTriangle}
            danger
          />

          <StatCard
            title="Out of Stock"
            value={summary.outOfStockItems}
            description="Unavailable items"
            icon={Trash2}
            danger
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

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-950/5">
            <div className="flex flex-col justify-between gap-4 border-b border-purple-100 p-5 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Product Stock
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View current stock levels and record movements.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:w-80">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search stock..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <select
                  value={stockFilter}
                  onChange={(event) => setStockFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
                >
                  <option value="">All Stock</option>
                  <option value="available">Available</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="p-5">
                <InventoryTableSkeleton />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 text-[#7C3AED]">
                  <Boxes className="h-8 w-8" />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  No inventory records found
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Products will appear here after they are created.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4">Batch</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product, index) => {
                      const isLowStock =
                        product.stockQuantity <= product.reorderLevel;
                      const isOutOfStock = product.stockQuantity === 0;

                      return (
                        <motion.tr
                          key={product._id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="transition hover:bg-purple-50/40"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                                <Package className="h-5 w-5" />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {product.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  SKU: {product.sku}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {getCategoryName(product)}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {getSupplierName(product)}
                          </td>

                          <td className="px-6 py-4">
                            <p
                              className={`text-lg font-bold ${
                                isOutOfStock || isLowStock
                                  ? "text-red-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {product.stockQuantity}
                            </p>
                            <p className="text-xs text-slate-500">
                              Reorder at {product.reorderLevel}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {product.batchNumber || "N/A"}
                          </td>

                          <td className="px-6 py-4">
                            {isOutOfStock ? (
                              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                                Low Stock
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                Available
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end">
                              <button
                                onClick={() => openMovementModal(product)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-purple-50 px-4 py-2 text-sm font-semibold text-[#7C3AED] transition hover:bg-purple-100"
                              >
                                <Plus className="h-4 w-4" />
                                Movement
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-950/5">
            <div className="border-b border-purple-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                  <History className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Recent Movements
                  </h2>
                  <p className="text-sm text-slate-500">
                    Last 100 stock records
                  </p>
                </div>
              </div>
            </div>

            {isMovementLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No stock movements yet
                </p>
              </div>
            ) : (
              <div className="max-h-[720px] space-y-3 overflow-y-auto p-5">
                {movements.map((movement) => {
                  const Icon = getMovementIcon(movement.movementType);

                  return (
                    <div
                      key={movement._id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${getMovementColor(
                            movement.movementType,
                          )}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {getMovementLabel(movement.movementType)}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {getMovementProductName(movement)}{" "}
                                {getMovementProductSku(movement)
                                  ? `• ${getMovementProductSku(movement)}`
                                  : ""}
                              </p>
                            </div>

                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
                              {movement.quantity}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-xl bg-white p-2">
                              <p className="text-slate-400">Previous</p>
                              <p className="font-bold text-slate-800">
                                {movement.previousStock}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-2">
                              <p className="text-slate-400">New</p>
                              <p className="font-bold text-slate-800">
                                {movement.newStock}
                              </p>
                            </div>
                          </div>

                          {movement.reason && (
                            <p className="mt-3 text-xs leading-5 text-slate-500">
                              {movement.reason}
                            </p>
                          )}

                          <p className="mt-3 text-xs text-slate-400">
                            {new Date(movement.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {movementModalOpen && (
          <MovementModal
            form={form}
            setForm={setForm}
            products={products}
            isSaving={isSaving}
            onClose={closeMovementModal}
            onSubmit={handleCreateMovement}
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
      <div className="flex items-center justify-between">
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

function MovementModal({
  form,
  setForm,
  products,
  isSaving,
  onClose,
  onSubmit,
}: {
  form: MovementFormState;
  setForm: React.Dispatch<React.SetStateAction<MovementFormState>>;
  products: InventoryProduct[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close stock movement overlay"
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
        className="fixed left-1/2 top-1/2 z-[90] max-h-[90vh] w-[94%] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-purple-950/30"
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white">
          <div>
            <h2 className="text-xl font-bold">Record Stock Movement</h2>
            <p className="mt-1 text-sm text-purple-100">
              Update product stock and keep traceability records.
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

        <form
          onSubmit={onSubmit}
          className="max-h-[calc(90vh-96px)] space-y-5 overflow-y-auto p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Product
            </label>

            <select
              value={form.productId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  productId: event.target.value,
                }))
              }
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} - {product.sku} - Stock:{" "}
                  {product.stockQuantity}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Movement Type
              </label>

              <select
                value={form.movementType}
                onChange={(event) => {
                  const movementType = event.target
                    .value as MovementFormState["movementType"];

                  setForm((current) => ({
                    ...current,
                    movementType,
                    referenceType:
                      movementType === "DAMAGED"
                        ? "DAMAGE"
                        : movementType === "RETURN"
                          ? "RETURN"
                          : movementType === "STOCK_IN"
                            ? "SUPPLIER"
                            : "MANUAL",
                  }));
                }}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              >
                <option value="STOCK_IN">Stock In</option>
                <option value="STOCK_OUT">Stock Out</option>
                <option value="RETURN">Return</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>

            <InputField
              label={
                form.movementType === "ADJUSTMENT"
                  ? "New Stock Quantity"
                  : "Quantity"
              }
              type="number"
              value={form.quantity}
              onChange={(value) =>
                setForm((current) => ({ ...current, quantity: value }))
              }
              placeholder="1"
              required
            />

            <InputField
              label="Batch Number"
              value={form.batchNumber}
              onChange={(value) =>
                setForm((current) => ({ ...current, batchNumber: value }))
              }
              placeholder="Optional batch number"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Reference Type
              </label>

              <select
                value={form.referenceType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    referenceType: event.target
                      .value as MovementFormState["referenceType"],
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              >
                <option value="SUPPLIER">Supplier</option>
                <option value="MANUAL">Manual</option>
                <option value="RETURN">Return</option>
                <option value="DAMAGE">Damage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Reason / Note
            </label>

            <textarea
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              rows={4}
              placeholder="Example: Stock received from supplier, damaged stock adjustment..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
            />
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-800">
            <p className="font-semibold">Movement Rules</p>
            <p className="mt-1 leading-6">
              Stock In and Return increase stock. Stock Out and Damaged reduce
              stock. Adjustment sets the stock quantity to the entered value.
            </p>
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
                  Save Movement
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
        min={type === "number" ? 1 : undefined}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
      />
    </div>
  );
}

function InventoryTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="grid animate-pulse grid-cols-7 gap-4 rounded-2xl border border-slate-100 p-4"
        >
          <div className="col-span-2 h-10 rounded-xl bg-slate-100" />
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
