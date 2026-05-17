// src/app/checkout/page.tsx

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { CartItem, clearCart, getCartItems, getCartTotal } from "@/lib/cart";

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type CheckoutForm = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
  paymentMethod: "MOCK_PAYMENT" | "CASH_ON_DELIVERY";
};

const initialForm: CheckoutForm = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "UAE",
  notes: "",
  paymentMethod: "MOCK_PAYMENT",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CheckoutForm>(initialForm);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.resolve().then(() => setItems(getCartItems()));
  }, []);

  const subtotal = getCartTotal(items);
  const deliveryFee = items.length > 0 ? 15 : 0;
  const total = subtotal + deliveryFee;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            address: form.address,
            city: form.city,
            postalCode: form.postalCode,
            country: form.country,
          },
          deliveryFee,
          discountAmount: 0,
          paymentMethod: form.paymentMethod,
          notes: form.notes,
        }),
      });

      const result: ApiResponse = await response.json();

      if (response.status === 401) {
        router.push("/login?redirect=/checkout");
        return;
      }

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to place order");
        return;
      }

      clearCart();
      router.push("/my-orders");
    } catch {
      setError("Something went wrong while placing your order");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-[2rem] border border-purple-100 bg-white p-10 text-center shadow-lg shadow-purple-950/5">
          <AlertTriangle className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Your cart is empty
          </h1>
          <button
            onClick={() => router.push("/products")}
            className="mt-5 rounded-2xl bg-purple-50 px-5 py-3 text-sm font-bold text-[#7C3AED]"
          >
            Shop Products
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white shadow-2xl shadow-purple-900/20 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">Checkout</h1>
              <p className="mt-3 text-sm text-purple-100">
                Add shipping details and place your order.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold">
              {items.length} item{items.length === 1 ? "" : "s"} ready
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          <div className="rounded-[2rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5">
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              Shipping Details
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Full Name"
                icon={UserRound}
                value={form.fullName}
                onChange={(value) =>
                  setForm((current) => ({ ...current, fullName: value }))
                }
                required
              />

              <InputField
                label="Phone"
                icon={Phone}
                value={form.phone}
                onChange={(value) =>
                  setForm((current) => ({ ...current, phone: value }))
                }
                required
              />

              <InputField
                label="City"
                icon={MapPin}
                value={form.city}
                onChange={(value) =>
                  setForm((current) => ({ ...current, city: value }))
                }
                required
              />

              <InputField
                label="Postal Code"
                icon={MapPin}
                value={form.postalCode}
                onChange={(value) =>
                  setForm((current) => ({ ...current, postalCode: value }))
                }
              />

              <InputField
                label="Country"
                icon={MapPin}
                value={form.country}
                onChange={(value) =>
                  setForm((current) => ({ ...current, country: value }))
                }
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Address
              </label>

              <textarea
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                required
                rows={4}
                placeholder="Delivery address..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Method
              </label>

              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    paymentMethod: event.target
                      .value as CheckoutForm["paymentMethod"],
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              >
                <option value="MOCK_PAYMENT">Mock Online Payment</option>
                <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
              </select>
            </div>

            <div className="mt-5">
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
                rows={3}
                placeholder="Optional order notes..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
              />
            </div>
          </div>

          <div className="h-fit rounded-[2rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-950/5">
            <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="font-bold text-slate-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <SummaryRow
                label="Delivery Fee"
                value={formatCurrency(deliveryFee)}
              />
              <SummaryRow label="Total" value={formatCurrency(total)} bold />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/25 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Place Order
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function InputField({
  label,
  icon: Icon,
  value,
  onChange,
  required = false,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-[#8B5CF6] focus-within:bg-white">
        <Icon className="h-5 w-5 text-slate-400" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </div>
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
