// src/app/products/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Filter,
  Loader2,
  Package,
  Search,
  ShoppingCart,
} from "lucide-react";
import { motion } from "framer-motion";
import { addToCart } from "@/lib/cart";

type Category = {
  _id: string;
  name: string;
  slug: string;
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
  images: {
    url: string;
    publicId: string;
  }[];
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

function getCategoryName(product: Product) {
  if (typeof product.categoryId === "string") return "Unknown";
  return product.categoryId?.name || "Unknown";
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const filteredProducts = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword);

      const matchesCategory =
        !categoryId ||
        (typeof product.categoryId !== "string" &&
          product.categoryId?._id === categoryId);

      return matchesSearch && matchesCategory;
    });
  }, [products, searchText, categoryId]);

  async function loadData() {
    setIsLoading(true);

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/store/products", { cache: "no-store" }),
        fetch("/api/store/categories", { cache: "no-store" }),
      ]);

      const productsResult: ApiResponse<Product[]> =
        await productsResponse.json();

      const categoriesResult: ApiResponse<Category[]> =
        await categoriesResponse.json();

      if (
        productsResponse.ok &&
        productsResult.success &&
        productsResult.data
      ) {
        setProducts(productsResult.data);
      }

      if (
        categoriesResponse.ok &&
        categoriesResult.success &&
        categoriesResult.data
      ) {
        setCategories(categoriesResult.data);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  function handleAddToCart(product: Product) {
    if (product.stockQuantity <= 0) return;

    const price =
      product.discountPrice > 0 ? product.discountPrice : product.price;

    addToCart({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      price,
      imageUrl: product.images?.[0]?.url || "",
      quantity: 1,
      stockQuantity: product.stockQuantity,
    });

    setMessage(`${product.name} added to cart`);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">Shop Products</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
                Browse the product catalogue, filter by category, and add
                available items to your cart.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <CatalogStat label="Products" value={products.length} />
              <CatalogStat label="Categories" value={categories.length} />
              <CatalogStat label="Showing" value={filteredProducts.length} />
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-purple-100 bg-white p-4 shadow-lg shadow-purple-950/5 lg:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Filter className="h-5 w-5 text-slate-400" />
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full bg-transparent text-sm outline-none lg:w-64"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#7C3AED]" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[2rem] border border-purple-100 bg-white p-12 text-center shadow-lg shadow-purple-950/5">
            <AlertTriangle className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 font-bold text-slate-900">No products found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or category filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-lg shadow-purple-950/5 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <Link href={`/products/${product.slug || product._id}`}>
                  <div className="flex aspect-square items-center justify-center bg-purple-50">
                    {product.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-14 w-14 text-[#7C3AED]" />
                    )}
                  </div>
                </Link>

                <div className="p-5">
                  <p className="mb-2 text-xs font-bold text-[#7C3AED]">
                    {getCategoryName(product)}
                  </p>

                  <Link href={`/products/${product.slug || product._id}`}>
                    <h3 className="line-clamp-1 font-bold text-slate-900 hover:text-[#7C3AED]">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {product.description || "No description available."}
                  </p>

                  <div className="mt-4">
                    <p className="text-lg font-bold text-slate-900">
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
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stockQuantity <= 0}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {product.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CatalogStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold text-purple-100">{label}</p>
    </div>
  );
}
