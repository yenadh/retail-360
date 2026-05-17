// src/components/layout/Navbar.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  ChevronDown,
  ClipboardList,
  FolderTree,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UserRole =
  | "ADMIN"
  | "CUSTOMER"
  | "INVENTORY_MANAGER"
  | "SALES_STAFF"
  | "DELIVERY_STAFF";

type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data?: CurrentUser;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    roles: ["CUSTOMER"],
  },
  {
    label: "Products",
    href: "/products",
    icon: ShoppingBag,
    roles: ["CUSTOMER"],
  },
  {
    label: "My Orders",
    href: "/my-orders",
    icon: ClipboardList,
    roles: ["CUSTOMER"],
  },
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "INVENTORY_MANAGER", "SALES_STAFF", "DELIVERY_STAFF"],
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    label: "Categories",
    href: "/admin/category",
    icon: FolderTree,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: Boxes,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    label: "Suppliers",
    href: "/admin/suppliers",
    icon: Building2,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ClipboardList,
    roles: ["ADMIN", "SALES_STAFF"],
  },
  {
    label: "Deliveries",
    href: "/admin/deliveries",
    icon: Truck,
    roles: ["ADMIN", "DELIVERY_STAFF"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
  },
];

function canShowItem(item: NavItem, role?: UserRole) {
  if (!item.roles) return true;
  if (!role) return false;

  return item.roles.includes(role);
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const hiddenRoutes = ["/login", "/register", "/unauthorized"];

  const shouldHideNavbar = hiddenRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => canShowItem(item, currentUser?.role));
  }, [currentUser]);

  useEffect(() => {
    function updateCartCount() {
      if (typeof window === "undefined") return;

      const storedCart = localStorage.getItem("retail360_cart");

      if (!storedCart) {
        setCartCount(0);
        return;
      }

      try {
        const cartItems = JSON.parse(storedCart) as { quantity: number }[];

        const totalItems = cartItems.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        );

        setCartCount(totalItems);
      } catch {
        setCartCount(0);
      }
    }

    updateCartCount();

    window.addEventListener("retail360-cart-updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("retail360-cart-updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  useEffect(() => {
    if (shouldHideNavbar) {
      return;
    }

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const result: ApiResponse = await response.json();

        if (response.ok && result.success && result.data) {
          setCurrentUser(result.data);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    loadCurrentUser();
  }, [shouldHideNavbar]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      setCurrentUser(null);
      setMobileOpen(false);
      setProfileOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (shouldHideNavbar) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-purple-100 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-purple-900/25">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-none text-slate-900">
                Retail360
              </h1>
              <p className="text-xs text-slate-500">Retail Management</p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 min-[1400px]:flex">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-purple-100 text-[#7C3AED]"
                      : "text-slate-600 hover:bg-purple-50 hover:text-[#7C3AED]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 min-[1400px]:flex">
            {currentUser?.role === "CUSTOMER" && (
              <Link
                href="/cart"
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-100 transition ${
                  pathname === "/cart"
                    ? "bg-purple-100 text-[#7C3AED]"
                    : "bg-purple-50 text-[#7C3AED] hover:bg-purple-100"
                }`}
                title="Cart"
              >
                <ShoppingCart className="h-5 w-5" />

                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-1 text-[10px] font-bold text-white shadow-md">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {loadingUser ? (
              <div className="h-10 w-28 animate-pulse rounded-2xl bg-slate-100" />
            ) : currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 px-3 py-2 text-left transition hover:bg-purple-100"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] text-white">
                    <User className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">
                      {currentUser.fullName}
                    </p>
                    <p className="text-xs text-purple-700">
                      {currentUser.role.replaceAll("_", " ")}
                    </p>
                  </div>

                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-2xl shadow-purple-950/10"
                    >
                      <div className="bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-5 text-white">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <p className="font-semibold">{currentUser.fullName}</p>
                        <p className="mt-1 text-sm text-purple-100">
                          {currentUser.email}
                        </p>
                      </div>

                      <div className="p-3">
                        <button
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <LogOut className="h-4 w-4" />
                          {loggingOut ? "Logging out..." : "Logout"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-purple-50 hover:text-[#7C3AED]"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/25"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] transition hover:bg-purple-100 min-[1400px]:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm min-[1400px]:hidden"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 28,
              }}
              className="fixed right-0 top-0 z-[90] flex h-dvh w-[86%] max-w-sm flex-col overflow-hidden rounded-l-[2rem] border-l border-purple-100 bg-white shadow-2xl shadow-purple-950/30 min-[1400px]:hidden"
            >
              <div className="bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-5 text-white">
                <div className="mb-6 flex items-center justify-between">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                      <ShoppingBag className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold leading-none">
                        Retail360
                      </h2>
                      <p className="mt-1 text-xs text-purple-100">
                        Retail Management
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => setMobileOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/25"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {loadingUser ? (
                  <div className="h-16 animate-pulse rounded-2xl bg-white/15" />
                ) : currentUser ? (
                  <div className="rounded-3xl bg-white/15 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                        <User className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {currentUser.fullName}
                        </p>
                        <p className="truncate text-sm text-purple-100">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-purple-50">
                      {currentUser.role.replaceAll("_", " ")}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white/15 p-4">
                    <p className="font-semibold">Welcome to Retail360</p>
                    <p className="mt-1 text-sm text-purple-100">
                      Login or create an account to continue.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                <div className="space-y-2">
                  {visibleNavItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.06 + index * 0.04,
                          duration: 0.22,
                        }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                            isActive
                              ? "bg-purple-100 text-[#7C3AED]"
                              : "text-slate-600 hover:bg-purple-50 hover:text-[#7C3AED]"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                              isActive
                                ? "bg-white text-[#7C3AED]"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-purple-100 p-4">
                {currentUser?.role === "CUSTOMER" && (
                  <Link
                    href="/cart"
                    onClick={() => setMobileOpen(false)}
                    className={`mb-3 flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      pathname === "/cart"
                        ? "bg-purple-100 text-[#7C3AED]"
                        : "bg-purple-50 text-[#7C3AED] hover:bg-purple-100"
                    }`}
                  >
                    <div className="relative">
                      <ShoppingCart className="h-4 w-4" />

                      {cartCount > 0 && (
                        <span className="absolute -right-3 -top-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-1 text-[9px] font-bold text-white">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </div>
                    Cart
                  </Link>
                )}

                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                ) : (
                  <div className="grid gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl bg-purple-50 px-4 py-3 text-center text-sm font-semibold text-[#7C3AED] transition hover:bg-purple-100"
                    >
                      Login
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-purple-900/25"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
