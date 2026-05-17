// src/app/admin/products/page.tsx

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Edit,
  Eye,
  Hash,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  Search,
  Star,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Category = {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: ProductCategory | string;
  price: number;
  discountPrice: number;
  stockQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  batchNumber: string;
  images: {
    url: string;
    publicId: string;
  }[];
  isFeatured: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type FormState = {
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  price: string;
  discountPrice: string;
  stockQuantity: string;
  reorderLevel: string;
  batchNumber: string;
  imageUrl: string;
  isFeatured: boolean;
  isActive: boolean;
};

const initialFormState: FormState = {
  name: "",
  sku: "",
  description: "",
  categoryId: "",
  price: "",
  discountPrice: "",
  stockQuantity: "0",
  reorderLevel: "10",
  batchNumber: "",
  imageUrl: "",
  isFeatured: false,
  isActive: true,
};

function getCategoryName(product: Product) {
  if (typeof product.categoryId === "string") return "Unknown";
  return product.categoryId?.name || "Unknown";
}

function getCategoryId(product: Product) {
  if (typeof product.categoryId === "string") return product.categoryId;
  return product.categoryId?._id || "";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword) ||
        getCategoryName(product).toLowerCase().includes(keyword)
      );
    });
  }, [products, searchText]);

  const totalProducts = products.length;
  const activeProducts = products.filter((item) => item.isActive).length;
  const lowStockProducts = products.filter(
    (item) => item.stockQuantity <= item.reorderLevel,
  ).length;
  const featuredProducts = products.filter((item) => item.isFeatured).length;

  async function loadInitialData() {
    setIsLoading(true);
    setError("");

    try {
      await Promise.all([loadProducts(), loadCategories()]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadInitialData());
  }, []);

  async function loadProducts() {
    try {
      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<Product[]> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Failed to load products");
        return;
      }

      setProducts(result.data);
    } catch {
      setError("Something went wrong while loading products");
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<Category[]> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        return;
      }

      setCategories(result.data.filter((category) => category.isActive));
    } catch {
      setCategories([]);
    }
  }

  function openCreateModal() {
    setSelectedProduct(null);
    setForm(initialFormState);
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setSelectedProduct(product);

    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      categoryId: getCategoryId(product),
      price: String(product.price ?? ""),
      discountPrice: String(product.discountPrice ?? ""),
      stockQuantity: String(product.stockQuantity ?? 0),
      reorderLevel: String(product.reorderLevel ?? 10),
      batchNumber: product.batchNumber || "",
      imageUrl: product.images?.[0]?.url || "",
      isFeatured: product.isFeatured,
      isActive: product.isActive,
    });

    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openDeleteModal(product: Product) {
    setSelectedProduct(product);
    setError("");
    setMessage("");
    setDeleteModalOpen(true);
  }

  function openDetailsModal(product: Product) {
    setSelectedProduct(product);
    setError("");
    setMessage("");
    setDetailsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;

    setModalOpen(false);
    setSelectedProduct(null);
    setForm(initialFormState);
  }

  function closeDeleteModal() {
    if (isDeleting) return;

    setDeleteModalOpen(false);
    setSelectedProduct(null);
  }

  function closeDetailsModal() {
    setDetailsModalOpen(false);
    setSelectedProduct(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const isEditMode = !!selectedProduct;

      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: Number(form.discountPrice || 0),
        stockQuantity: Number(form.stockQuantity || 0),
        reorderLevel: Number(form.reorderLevel || 10),
      };

      const response = await fetch(
        isEditMode ? `/api/products/${selectedProduct._id}` : "/api/products",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result: ApiResponse<Product> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to save product");
        return;
      }

      setMessage(result.message);
      setModalOpen(false);
      setSelectedProduct(null);
      setForm(initialFormState);

      await loadProducts();
    } catch {
      setError("Something went wrong while saving product");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedProduct) return;

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: "DELETE",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to delete product");
        return;
      }

      setMessage(result.message);
      setDeleteModalOpen(false);
      setSelectedProduct(null);

      await loadProducts();
    } catch {
      setError("Something went wrong while deleting product");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-purple-50">
                <Package className="h-4 w-4" />
                Admin Product Management
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Product Inventory
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
                Create, update, manage and soft delete products. This module
                supports stock control, category mapping and online product
                visibility.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Products"
            value={totalProducts}
            description="All active records"
            icon={Package}
          />
          <StatCard
            title="Active"
            value={activeProducts}
            description="Visible products"
            icon={ToggleRight}
          />
          <StatCard
            title="Low Stock"
            value={lowStockProducts}
            description="Need restocking"
            icon={Boxes}
          />
          <StatCard
            title="Featured"
            value={featuredProducts}
            description="Highlighted items"
            icon={Star}
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
              <h2 className="text-xl font-bold text-slate-900">Product List</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, create, edit and soft delete product records. Click a
                row to view product details.
              </p>
            </div>

            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-96">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search product, SKU, category..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <ProductTableSkeleton />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 text-[#7C3AED]">
                <Package className="h-8 w-8" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                No products found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Create your first product to start building your retail
                catalogue.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Featured</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product, index) => {
                    const isLowStock =
                      product.stockQuantity <= product.reorderLevel;

                    return (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => openDetailsModal(product)}
                        className="cursor-pointer transition hover:bg-purple-50/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-purple-100 text-[#7C3AED]">
                              {product.images?.[0]?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.images[0].url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6" />
                              )}
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

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {getCategoryName(product)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(
                              product.discountPrice > 0
                                ? product.discountPrice
                                : product.price,
                            )}
                          </p>

                          {product.discountPrice > 0 && (
                            <p className="text-xs text-slate-400 line-through">
                              {formatCurrency(product.price)}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p
                              className={`font-semibold ${
                                isLowStock ? "text-red-600" : "text-slate-900"
                              }`}
                            >
                              {product.stockQuantity}
                            </p>
                            <p className="text-xs text-slate-500">
                              Reorder at {product.reorderLevel}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {product.isActive ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              <ToggleRight className="h-4 w-4" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                              <ToggleLeft className="h-4 w-4" />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {product.isFeatured ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                              <Star className="h-4 w-4" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">No</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openDetailsModal(product);
                              }}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditModal(product);
                              }}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] transition hover:bg-purple-100"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openDeleteModal(product);
                              }}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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
      </section>

      <AnimatePresence>
        {modalOpen && (
          <ProductFormModal
            form={form}
            setForm={setForm}
            categories={categories}
            selectedProduct={selectedProduct}
            isSaving={isSaving}
            onClose={closeModal}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailsModalOpen && selectedProduct && (
          <ProductDetailsModal
            product={selectedProduct}
            onClose={closeDetailsModal}
            onEdit={() => {
              const productToEdit = selectedProduct;
              setDetailsModalOpen(false);

              if (productToEdit) {
                openEditModal(productToEdit);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && selectedProduct && (
          <DeleteProductModal
            product={selectedProduct}
            isDeleting={isDeleting}
            onClose={closeDeleteModal}
            onDelete={handleDelete}
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
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-purple-100 bg-white p-5 shadow-lg shadow-purple-950/5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-500">{description}</p>
    </motion.div>
  );
}

function ProductDetailsModal({
  product,
  onClose,
  onEdit,
}: {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}) {
  const sellingPrice =
    product.discountPrice > 0 ? product.discountPrice : product.price;

  const hasDiscount = product.discountPrice > 0;
  const isLowStock = product.stockQuantity <= product.reorderLevel;
  const imageUrl = product.images?.[0]?.url;

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close product details overlay"
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
              Product Details
            </div>

            <h2 className="text-2xl font-bold">{product.name}</h2>

            <p className="mt-1 text-sm text-purple-100">
              SKU: {product.sku} • {getCategoryName(product)}
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
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="space-y-4">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] border border-purple-100 bg-purple-50">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-[#7C3AED]">
                    <ImageIcon className="mx-auto h-14 w-14" />
                    <p className="mt-3 text-sm font-semibold">
                      No product image
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-purple-100 bg-purple-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Selling Price
                </p>

                <div className="mt-2 flex items-end gap-3">
                  <h3 className="text-3xl font-bold text-slate-900">
                    {formatCurrency(sellingPrice)}
                  </h3>

                  {hasDiscount && (
                    <p className="pb-1 text-sm text-slate-400 line-through">
                      {formatCurrency(product.price)}
                    </p>
                  )}
                </div>

                {hasDiscount && (
                  <p className="mt-2 inline-flex rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700">
                    Discount Applied
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <ProductInfoCard icon={Hash} label="SKU" value={product.sku} />

                <ProductInfoCard
                  icon={Tag}
                  label="Category"
                  value={getCategoryName(product)}
                />

                <ProductInfoCard
                  icon={DollarSign}
                  label="Base Price"
                  value={formatCurrency(product.price)}
                />

                <ProductInfoCard
                  icon={Boxes}
                  label="Stock Quantity"
                  value={`${product.stockQuantity}`}
                  status={isLowStock ? "Low Stock" : "In Stock"}
                  danger={isLowStock}
                />

                <ProductInfoCard
                  icon={Package}
                  label="Reorder Level"
                  value={`${product.reorderLevel}`}
                />

                <ProductInfoCard
                  icon={BadgeCheck}
                  label="Status"
                  value={product.isActive ? "Active" : "Inactive"}
                  danger={!product.isActive}
                />

                <ProductInfoCard
                  icon={Star}
                  label="Featured"
                  value={product.isFeatured ? "Yes" : "No"}
                />

                <ProductInfoCard
                  icon={Hash}
                  label="Batch Number"
                  value={product.batchNumber || "Not provided"}
                />

                <ProductInfoCard
                  icon={CalendarDays}
                  label="Created Date"
                  value={new Date(product.createdAt).toLocaleDateString()}
                />
              </div>

              <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Description
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {product.description || "No description provided."}
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-100 bg-white p-5">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Inventory Summary
                </h3>

                <div className="space-y-3">
                  <InventoryProgress
                    label="Available Stock"
                    value={product.stockQuantity}
                    max={Math.max(
                      product.reorderLevel * 2,
                      product.stockQuantity,
                    )}
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Reserved
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {product.reservedQuantity || 0}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Reorder Level
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {product.reorderLevel}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-4 ${
                        isLowStock ? "bg-red-50" : "bg-emerald-50"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold ${
                          isLowStock ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        Stock Status
                      </p>
                      <p
                        className={`mt-1 text-xl font-bold ${
                          isLowStock ? "text-red-700" : "text-emerald-700"
                        }`}
                      >
                        {isLowStock ? "Low" : "Good"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  onClick={onEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01]"
                >
                  <Edit className="h-4 w-4" />
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function ProductInfoCard({
  icon: Icon,
  label,
  value,
  status,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  status?: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-4 ${
        danger
          ? "border-red-100 bg-red-50"
          : "border-purple-100 bg-white shadow-sm shadow-purple-950/5"
      }`}
    >
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${
          danger ? "bg-red-100 text-red-600" : "bg-purple-100 text-[#7C3AED]"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p
        className={`text-xs font-bold uppercase tracking-wide ${
          danger ? "text-red-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-bold ${
          danger ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>

      {status && (
        <p
          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
            danger
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}

function InventoryProgress({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = Math.min(
    100,
    Math.round((value / Math.max(max, 1)) * 100),
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-sm font-bold text-[#7C3AED]">{value}</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-purple-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899]"
        />
      </div>
    </div>
  );
}

function ProductFormModal({
  form,
  setForm,
  categories,
  selectedProduct,
  isSaving,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  categories: Category[];
  selectedProduct: Product | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const isEditMode = !!selectedProduct;

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close modal overlay"
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
        className="fixed left-1/2 top-1/2 z-[90] max-h-[90vh] w-[94%] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-purple-950/30"
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white">
          <div>
            <h2 className="text-xl font-bold">
              {isEditMode ? "Edit Product" : "Create Product"}
            </h2>
            <p className="mt-1 text-sm text-purple-100">
              {isEditMode
                ? "Update product details and inventory values."
                : "Add a new product to your retail catalogue."}
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
          <div className="grid gap-5 md:grid-cols-2">
            <InputField
              label="Product Name"
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              placeholder="Example: Wireless Mouse"
              required
            />

            <InputField
              label="SKU"
              value={form.sku}
              onChange={(value) =>
                setForm((current) => ({ ...current, sku: value }))
              }
              placeholder="Example: WM-001"
              required
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Category
              </label>

              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <InputField
              label="Image URL"
              value={form.imageUrl}
              onChange={(value) =>
                setForm((current) => ({ ...current, imageUrl: value }))
              }
              placeholder="https://example.com/product.jpg"
            />

            <InputField
              label="Price"
              type="number"
              value={form.price}
              onChange={(value) =>
                setForm((current) => ({ ...current, price: value }))
              }
              placeholder="0.00"
              required
            />

            <InputField
              label="Discount Price"
              type="number"
              value={form.discountPrice}
              onChange={(value) =>
                setForm((current) => ({ ...current, discountPrice: value }))
              }
              placeholder="0.00"
            />

            <InputField
              label="Stock Quantity"
              type="number"
              value={form.stockQuantity}
              onChange={(value) =>
                setForm((current) => ({ ...current, stockQuantity: value }))
              }
              placeholder="0"
            />

            <InputField
              label="Reorder Level"
              type="number"
              value={form.reorderLevel}
              onChange={(value) =>
                setForm((current) => ({ ...current, reorderLevel: value }))
              }
              placeholder="10"
            />

            <InputField
              label="Batch Number"
              value={form.batchNumber}
              onChange={(value) =>
                setForm((current) => ({ ...current, batchNumber: value }))
              }
              placeholder="Optional batch number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              placeholder="Product description..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ToggleButton
              title="Product Status"
              description="Active products can be used and displayed."
              enabled={form.isActive}
              enabledText="Active"
              disabledText="Inactive"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  isActive: !current.isActive,
                }))
              }
            />

            <ToggleButton
              title="Featured Product"
              description="Featured products can be shown on homepage."
              enabled={form.isFeatured}
              enabledText="Featured"
              disabledText="Normal"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  isFeatured: !current.isFeatured,
                }))
              }
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
                  {isEditMode ? "Update Product" : "Create Product"}
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
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
      />
    </div>
  );
}

function ToggleButton({
  title,
  description,
  enabled,
  enabledText,
  disabledText,
  onClick,
}: {
  title: string;
  description: string;
  enabled: boolean;
  enabledText: string;
  disabledText: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-left"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {enabled ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          <ToggleRight className="h-4 w-4" />
          {enabledText}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
          <ToggleLeft className="h-4 w-4" />
          {disabledText}
        </span>
      )}
    </button>
  );
}

function DeleteProductModal({
  product,
  isDeleting,
  onClose,
  onDelete,
}: {
  product: Product;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close delete modal overlay"
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
        className="fixed left-1/2 top-1/2 z-[90] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl shadow-purple-950/30"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h2 className="text-center text-xl font-bold text-slate-900">
          Delete Product?
        </h2>

        <p className="mt-3 text-center text-sm leading-6 text-slate-500">
          Are you sure you want to delete{" "}
          <span className="font-bold text-slate-800">{product.name}</span>? This
          will soft delete the product and remove it from active lists.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function ProductTableSkeleton() {
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
