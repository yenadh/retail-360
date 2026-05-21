// src/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CreditCard,
  Headphones,
  Loader2,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

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
  isFeatured: boolean;
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

export default function StoreHomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadFeaturedProducts() {
    try {
      const response = await fetch("/api/store/products?featured=true", {
        cache: "no-store",
      });

      const result: ApiResponse<Product[]> = await response.json();

      if (response.ok && result.success && result.data) {
        setFeaturedProducts(result.data.slice(0, 4));
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4" />
              Welcome to Retail360
            </div>

            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
              Shop smarter and run retail operations with confidence.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-purple-100 sm:text-base">
              Retail360 connects customers, stock teams, sales staff, and
              delivery teams in one clean workflow from product discovery to
              doorstep delivery.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:scale-[1.02]"
              >
                Shop Products
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/my-orders"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Track Orders
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroStat value="360°" label="Retail visibility" />
              <HeroStat value="24/7" label="Online shopping" />
              <HeroStat value="Live" label="Stock awareness" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={Package}
                title="Products"
                text="Browse catalogue"
              />
              <FeatureCard
                icon={Boxes}
                title="Inventory"
                text="Live stock levels"
              />
              <FeatureCard
                icon={Truck}
                title="Delivery"
                text="Track delivery flow"
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Secure"
                text="Verified accounts"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <ValueCard
          icon={Store}
          title="Curated Shopping"
          text="Explore products, compare prices, and add available stock to cart without friction."
        />
        <ValueCard
          icon={CreditCard}
          title="Simple Checkout"
          text="Place orders with delivery details, payment status tracking, and order history."
        />
        <ValueCard
          icon={Headphones}
          title="Connected Support"
          text="Customers and staff share the same operational source of truth."
        />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-950/5 lg:grid-cols-[1fr_1.1fr]">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#7C3AED] shadow-sm">
              <Sparkles className="h-4 w-4" />
              Built for both sides of retail
            </div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              A storefront for customers and a command center for teams.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Customers get a polished shopping journey. Admins and staff get
              inventory, categories, orders, suppliers, deliveries, users, and
              reports in one role-aware workspace.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <ProcessStep
              number="01"
              title="Discover"
              text="Browse active categories and products."
            />
            <ProcessStep
              number="02"
              title="Order"
              text="Add to cart and complete checkout."
            />
            <ProcessStep
              number="03"
              title="Fulfill"
              text="Sales, inventory, and delivery teams process orders."
            />
            <ProcessStep
              number="04"
              title="Track"
              text="Customers follow order progress from their account."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Featured Products
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Popular products selected for customers.
            </p>
          </div>

          <Link
            href="/products"
            className="hidden rounded-2xl bg-purple-50 px-4 py-2 text-sm font-bold text-[#7C3AED] transition hover:bg-purple-100 sm:inline-flex"
          >
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-[2rem] border border-purple-100 bg-white p-10 text-center shadow-lg shadow-purple-950/5">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 font-bold text-slate-900">
              No featured products yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Featured products will appear here after admin marks products as
              featured.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Link
                  href={`/products/${product.slug || product._id}`}
                  className="block overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-lg shadow-purple-950/5 transition hover:-translate-y-1 hover:shadow-xl"
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
                      <Package className="h-14 w-14 text-[#7C3AED]" />
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-1 font-bold text-slate-900">
                      {product.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {product.description || "No description available."}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="font-bold text-[#7C3AED]">
                        {formatCurrency(
                          product.discountPrice > 0
                            ? product.discountPrice
                            : product.price,
                        )}
                      </p>

                      {product.stockQuantity > 0 ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          In Stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                          Out
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-purple-100">
                <Users className="h-4 w-4" />
                Ready to explore?
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Start shopping or sign in to manage your retail operations.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Retail360 keeps shopping, stock movement, order handling, and
                reporting connected from the first click to final delivery.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950"
              >
                Browse Products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium text-purple-100">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white/15 p-5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-purple-100">{text}</p>
    </div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      className="rounded-[2rem] border border-purple-100 bg-white p-6 shadow-lg shadow-purple-950/5"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </motion.div>
  );
}

function ProcessStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <span className="text-xs font-bold text-[#7C3AED]">{number}</span>
      <h3 className="mt-2 font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
