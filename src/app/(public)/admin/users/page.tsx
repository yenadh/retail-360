// src/app/admin/users/page.tsx

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type UserRole =
  | "ADMIN"
  | "CUSTOMER"
  | "INVENTORY_MANAGER"
  | "SALES_STAFF"
  | "DELIVERY_STAFF";

type User = {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  customers: User[];
  systemUsers: User[];
  all: User[];
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

type FormState = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  isEmailVerified: boolean;
  isActive: boolean;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  password: "",
  role: "SALES_STAFF",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  isEmailVerified: true,
  isActive: true,
};

const systemRoles: UserRole[] = [
  "ADMIN",
  "INVENTORY_MANAGER",
  "SALES_STAFF",
  "DELIVERY_STAFF",
];

function getRoleLabel(role: UserRole) {
  return role.replaceAll("_", " ");
}

function getRoleClass(role: UserRole) {
  const classes: Record<UserRole, string> = {
    ADMIN: "bg-red-50 text-red-700",
    CUSTOMER: "bg-slate-100 text-slate-600",
    INVENTORY_MANAGER: "bg-purple-50 text-purple-700",
    SALES_STAFF: "bg-blue-50 text-blue-700",
    DELIVERY_STAFF: "bg-orange-50 text-orange-700",
  };

  return classes[role];
}

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  const [activeTab, setActiveTab] = useState<"customers" | "system">(
    "customers",
  );
  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentList = activeTab === "customers" ? customers : systemUsers;

  const filteredUsers = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return currentList;

    return currentList.filter((user) => {
      return (
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword) ||
        user.phone.toLowerCase().includes(keyword) ||
        user.city.toLowerCase().includes(keyword)
      );
    });
  }, [currentList, searchText]);

  const totalCustomers = customers.length;
  const totalSystemUsers = systemUsers.length;
  const activeCustomers = customers.filter((x) => x.isActive).length;
  const activeSystemUsers = systemUsers.filter((x) => x.isActive).length;

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<UsersResponse> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Failed to load users");
        return;
      }

      setCustomers(result.data.customers);
      setSystemUsers(result.data.systemUsers);
    } catch {
      setError("Something went wrong while loading users");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateSystemUserModal() {
    setSelectedUser(null);
    setForm(initialFormState);
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setSelectedUser(user);

    setForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
    });

    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openDeleteModal(user: User) {
    setSelectedUser(user);
    setError("");
    setMessage("");
    setDeleteModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;

    setModalOpen(false);
    setSelectedUser(null);
    setForm(initialFormState);
  }

  function closeDeleteModal() {
    if (isDeleting) return;

    setDeleteModalOpen(false);
    setSelectedUser(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const isEditMode = !!selectedUser;

      const payload: Partial<FormState> = {
        ...form,
      };

      if (isEditMode && !payload.password) {
        delete payload.password;
      }

      const response = await fetch(
        isEditMode ? `/api/users/${selectedUser._id}` : "/api/users",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result: ApiResponse<User> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to save user");
        return;
      }

      setMessage(result.message);
      setModalOpen(false);
      setSelectedUser(null);
      setForm(initialFormState);

      await loadUsers();
    } catch {
      setError("Something went wrong while saving user");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "DELETE",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to delete user");
        return;
      }

      setMessage(result.message);
      setDeleteModalOpen(false);
      setSelectedUser(null);

      await loadUsers();
    } catch {
      setError("Something went wrong while deleting user");
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
                <Users className="h-4 w-4" />
                Admin User Management
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">Users</h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
                Manage customers and internal system users separately. Control
                access, roles, activation, and account details.
              </p>
            </div>

            <button
              onClick={openCreateSystemUserModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              Add System User
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Customers"
            value={totalCustomers}
            description={`${activeCustomers} active customers`}
            icon={UserRound}
          />

          <StatCard
            title="System Users"
            value={totalSystemUsers}
            description={`${activeSystemUsers} active system users`}
            icon={ShieldCheck}
          />

          <StatCard
            title="Active Customers"
            value={activeCustomers}
            description="Can login and order"
            icon={ToggleRight}
          />

          <StatCard
            title="Active Staff"
            value={activeSystemUsers}
            description="Can access admin modules"
            icon={ShieldCheck}
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
          <div className="flex flex-col justify-between gap-4 border-b border-purple-100 p-5 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">User List</h2>
              <p className="mt-1 text-sm text-slate-500">
                View customers and system users separately.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="grid grid-cols-2 rounded-2xl bg-purple-50 p-1">
                <button
                  onClick={() => {
                    setActiveTab("customers");
                    setSearchText("");
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    activeTab === "customers"
                      ? "bg-white text-[#7C3AED] shadow"
                      : "text-slate-500"
                  }`}
                >
                  Customers
                </button>

                <button
                  onClick={() => {
                    setActiveTab("system");
                    setSearchText("");
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    activeTab === "system"
                      ? "bg-white text-[#7C3AED] shadow"
                      : "text-slate-500"
                  }`}
                >
                  System Users
                </button>
              </div>

              <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-96">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search user..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <UserTableSkeleton />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <Users className="h-14 w-14 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No users found
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                {activeTab === "customers"
                  ? "Customers will appear here after registration."
                  : "Create your first system user to manage admin access."}
              </p>

              {activeTab === "system" && (
                <button
                  onClick={openCreateSystemUserModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25"
                >
                  <Plus className="h-4 w-4" />
                  Add System User
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Email Verified</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="transition hover:bg-purple-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                            {user.role === "CUSTOMER" ? (
                              <UserRound className="h-6 w-6" />
                            ) : (
                              <ShieldCheck className="h-6 w-6" />
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.fullName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getRoleClass(
                            user.role,
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.phone || "No phone"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.city || "No city"}
                      </td>

                      <td className="px-6 py-4">
                        {user.isEmailVerified ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
                            <AlertTriangle className="h-4 w-4" />
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {user.isActive ? (
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

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] transition hover:bg-purple-100"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openDeleteModal(user)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {modalOpen && (
          <UserFormModal
            form={form}
            setForm={setForm}
            selectedUser={selectedUser}
            isSaving={isSaving}
            activeTab={activeTab}
            onClose={closeModal}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && selectedUser && (
          <DeleteUserModal
            user={selectedUser}
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
      <div className="flex items-center justify-between gap-4">
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

function UserFormModal({
  form,
  setForm,
  selectedUser,
  isSaving,
  activeTab,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  selectedUser: User | null;
  isSaving: boolean;
  activeTab: "customers" | "system";
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const isEditMode = !!selectedUser;
  const isCustomer = selectedUser?.role === "CUSTOMER";

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close user modal overlay"
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
              {isEditMode
                ? isCustomer
                  ? "Edit Customer"
                  : "Edit System User"
                : "Create System User"}
            </h2>
            <p className="mt-1 text-sm text-purple-100">
              {isEditMode
                ? "Update user details, role, and access status."
                : "Create a new internal user for admin module access."}
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
              label="Full Name"
              icon={UserRound}
              value={form.fullName}
              onChange={(value) =>
                setForm((current) => ({ ...current, fullName: value }))
              }
              placeholder="Example: John Smith"
              required
            />

            <InputField
              label="Email"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(value) =>
                setForm((current) => ({ ...current, email: value }))
              }
              placeholder="user@example.com"
              required
            />

            {!isCustomer && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                </label>

                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value as UserRole,
                    }))
                  }
                  disabled={isCustomer}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {systemRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <InputField
              label={isEditMode ? "New Password Optional" : "Password"}
              icon={ShieldCheck}
              type="password"
              value={form.password}
              onChange={(value) =>
                setForm((current) => ({ ...current, password: value }))
              }
              placeholder={
                isEditMode
                  ? "Leave empty to keep current password"
                  : "Minimum 8 characters"
              }
              required={!isEditMode}
            />

            <InputField
              label="Phone"
              icon={Phone}
              value={form.phone}
              onChange={(value) =>
                setForm((current) => ({ ...current, phone: value }))
              }
              placeholder="+971 50 000 0000"
            />

            <InputField
              label="City"
              icon={MapPin}
              value={form.city}
              onChange={(value) =>
                setForm((current) => ({ ...current, city: value }))
              }
              placeholder="Dubai"
            />

            <InputField
              label="Postal Code"
              icon={MapPin}
              value={form.postalCode}
              onChange={(value) =>
                setForm((current) => ({ ...current, postalCode: value }))
              }
              placeholder="Postal code"
            />
          </div>

          <div>
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
              rows={3}
              placeholder="User address..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ToggleButton
              title="Account Status"
              description="Inactive users cannot login."
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
              title="Email Verification"
              description="Verified users can access the system."
              enabled={form.isEmailVerified}
              enabledText="Verified"
              disabledText="Pending"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  isEmailVerified: !current.isEmailVerified,
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
                  {isEditMode ? "Update User" : "Create User"}
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
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  icon: React.ElementType;
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

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-[#8B5CF6] focus-within:bg-white">
        <Icon className="h-5 w-5 text-slate-400" />

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
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

function DeleteUserModal({
  user,
  isDeleting,
  onClose,
  onDelete,
}: {
  user: User;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close delete user overlay"
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
          Delete User?
        </h2>

        <p className="mt-3 text-center text-sm leading-6 text-slate-500">
          Are you sure you want to delete{" "}
          <span className="font-bold text-slate-800">{user.fullName}</span>?
          This will soft delete the user and disable login access.
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

function UserTableSkeleton() {
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
