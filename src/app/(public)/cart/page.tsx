// src/app/cart/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, ShoppingCart, Trash2 } from "lucide-react";
import {
  CartItem,
  getCartItems,
  getCartTotal,
  removeCartItem,
  updateCartQuantity,
} from "@/lib/cart";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    void Promise.resolve().then(() => setItems(getCartItems()));
  }, []);

  function handleUpdateQuantity(productId: string, quantity: number) {
    setItems(updateCartQuantity(productId, quantity));
  }

  function handleRemove(productId: string) {
    setItems(removeCartItem(productId));
  }

  const subtotal = getCartTotal(items);
  const deliveryFee = items.length > 0 ? 15 : 0;
  const total = subtotal + deliveryFee;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED]"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <h1 className="text-3xl font-bold sm:text-4xl">Shopping Cart</h1>
          <p className="mt-3 text-sm text-purple-100">
            Review your selected products before checkout.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[2rem] border border-purple-100 bg-white p-12 text-center shadow-lg shadow-purple-950/5">
            <ShoppingCart className="mx-auto h-14 w-14 text-slate-300" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add products to your cart to continue checkout.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-6 py-3 text-sm font-bold text-white"
            >
              Shop Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col gap-4 rounded-[2rem] border border-purple-100 bg-white p-5 shadow-lg shadow-purple-950/5 sm:flex-row sm:items-center"
                >
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-purple-50">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-[#7C3AED]" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      SKU: {item.sku}
                    </p>
                    <p className="mt-2 font-bold text-[#7C3AED]">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.productId, item.quantity - 1)
                      }
                      className="h-10 w-10 rounded-2xl bg-purple-50 font-bold text-[#7C3AED]"
                    >
                      -
                    </button>

                    <span className="flex h-10 w-14 items-center justify-center rounded-2xl bg-slate-100 font-bold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.productId, item.quantity + 1)
                      }
                      className="h-10 w-10 rounded-2xl bg-purple-50 font-bold text-[#7C3AED]"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-[2rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5">
              <h2 className="text-xl font-bold text-slate-900">
                Order Summary
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Delivery fee is calculated for the current cart.
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                <SummaryRow
                  label="Delivery Fee"
                  value={formatCurrency(deliveryFee)}
                />
                <div className="border-t border-slate-100 pt-3">
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(total)}
                    bold
                  />
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 inline-flex w-full justify-center rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/25"
              >
                Proceed to Checkout
              </Link>

              <div className="mt-5 rounded-2xl bg-purple-50 p-4 text-sm leading-6 text-purple-800">
                Your cart is saved in this browser and can be adjusted before
                checkout.
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
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
