// src/app/products/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { addToCart } from "@/lib/cart";

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
  reorderLevel: number;
  batchNumber: string;
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

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/store/products/${id}`, {
        cache: "no-store",
      });

      const result: ApiResponse<Product> = await response.json();

      if (response.ok && result.success && result.data) {
        setProduct(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddToCart() {
    if (!product || product.stockQuantity <= 0) return;

    const price =
      product.discountPrice > 0 ? product.discountPrice : product.price;

    addToCart({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      price,
      imageUrl: product.images?.[0]?.url || "",
      quantity,
      stockQuantity: product.stockQuantity,
    });

    setMessage("Product added to cart");

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#7C3AED]" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-[2rem] border border-purple-100 bg-white p-10 text-center shadow-lg shadow-purple-950/5">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Product not found
          </h1>
          <Link
            href="/products"
            className="mt-5 inline-flex rounded-2xl bg-purple-50 px-5 py-3 text-sm font-bold text-[#7C3AED]"
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const sellingPrice =
    product.discountPrice > 0 ? product.discountPrice : product.price;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-950/5"
          >
            <div className="flex aspect-square items-center justify-center bg-purple-50">
              {product.images?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-20 w-20 text-[#7C3AED]" />
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5 sm:p-8"
          >
            <p className="mb-3 inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-[#7C3AED]">
              {getCategoryName(product)}
            </p>

            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">SKU: {product.sku}</p>

            <div className="mt-6 flex items-end gap-3">
              <h2 className="text-3xl font-bold text-[#7C3AED]">
                {formatCurrency(sellingPrice)}
              </h2>

              {product.discountPrice > 0 && (
                <p className="pb-1 text-lg text-slate-400 line-through">
                  {formatCurrency(product.price)}
                </p>
              )}
            </div>

            <p className="mt-6 leading-7 text-slate-600">
              {product.description || "No description available."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Stock
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {product.stockQuantity} available
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Batch
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {product.batchNumber || "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                className="h-11 w-11 rounded-2xl bg-purple-50 text-lg font-bold text-[#7C3AED]"
              >
                -
              </button>

              <span className="flex h-11 w-16 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-900">
                {quantity}
              </span>

              <button
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(product.stockQuantity, current + 1),
                  )
                }
                className="h-11 w-11 rounded-2xl bg-purple-50 text-lg font-bold text-[#7C3AED]"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-purple-900/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart className="h-5 w-5" />
              {product.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
            </button>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-purple-50 p-4 text-sm text-purple-800">
              <Truck className="h-5 w-5" />
              Delivery tracking is available after checkout.
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
