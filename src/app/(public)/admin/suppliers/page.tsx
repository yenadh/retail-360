"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Supplier = {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
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
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  isActive: boolean;
};

const initialFormState: FormState = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  isActive: true,
};

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  const [form, setForm] = useState<FormState>(initialFormState);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredSuppliers = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return suppliers;

    return suppliers.filter((supplier) => {
      return (
        supplier.name.toLowerCase().includes(keyword) ||
        supplier.contactPerson.toLowerCase().includes(keyword) ||
        supplier.email.toLowerCase().includes(keyword) ||
        supplier.phone.toLowerCase().includes(keyword) ||
        supplier.city.toLowerCase().includes(keyword) ||
        supplier.country.toLowerCase().includes(keyword)
      );
    });
  }, [suppliers, searchText]);

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((item) => item.isActive).length;
  const inactiveSuppliers = suppliers.filter((item) => !item.isActive).length;

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/suppliers", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<Supplier[]> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Failed to load suppliers");
        return;
      }

      setSuppliers(result.data);
    } catch {
      setError("Something went wrong while loading suppliers");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setSelectedSupplier(null);
    setForm(initialFormState);
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openEditModal(supplier: Supplier) {
    setSelectedSupplier(supplier);

    setForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      country: supplier.country || "",
      isActive: supplier.isActive,
    });

    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openDeleteModal(supplier: Supplier) {
    setSelectedSupplier(supplier);
    setError("");
    setMessage("");
    setDeleteModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;

    setModalOpen(false);
    setSelectedSupplier(null);
    setForm(initialFormState);
  }

  function closeDeleteModal() {
    if (isDeleting) return;

    setDeleteModalOpen(false);
    setSelectedSupplier(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const isEditMode = !!selectedSupplier;

      const response = await fetch(
        isEditMode
          ? `/api/suppliers/${selectedSupplier._id}`
          : "/api/suppliers",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const result: ApiResponse<Supplier> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to save supplier");
        return;
      }

      setMessage(result.message);
      setModalOpen(false);
      setSelectedSupplier(null);
      setForm(initialFormState);

      await loadSuppliers();
    } catch {
      setError("Something went wrong while saving supplier");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedSupplier) return;

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/suppliers/${selectedSupplier._id}`, {
        method: "DELETE",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to delete supplier");
        return;
      }

      setMessage(result.message);
      setDeleteModalOpen(false);
      setSelectedSupplier(null);

      await loadSuppliers();
    } catch {
      setError("Something went wrong while deleting supplier");
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
                <Building2 className="h-4 w-4" />
                Admin Supplier Management
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">Suppliers</h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
                Manage suppliers used for purchasing and product traceability.
                Supplier records help connect stock sources with retail
                inventory.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              Add Supplier
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Suppliers"
            value={totalSuppliers}
            description="All supplier records"
            icon={Building2}
          />

          <StatCard
            title="Active Suppliers"
            value={activeSuppliers}
            description="Available for products"
            icon={ToggleRight}
          />

          <StatCard
            title="Inactive Suppliers"
            value={inactiveSuppliers}
            description="Disabled suppliers"
            icon={ToggleLeft}
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
              <h2 className="text-xl font-bold text-slate-900">
                Supplier List
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, create, edit and soft delete supplier records.
              </p>
            </div>

            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-96">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search supplier..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <SupplierTableSkeleton />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 text-[#7C3AED]">
                <Building2 className="h-8 w-8" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                No suppliers found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Create your first supplier to support product sourcing and
                traceability.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25"
              >
                <Plus className="h-4 w-4" />
                Add Supplier
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map((supplier, index) => (
                    <motion.tr
                      key={supplier._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="transition hover:bg-purple-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                            <Building2 className="h-6 w-6" />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {supplier.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {supplier._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {supplier.contactPerson || "Not provided"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {supplier.phone || "No phone"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {supplier.email || "No email"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {[supplier.city, supplier.country]
                          .filter(Boolean)
                          .join(", ") || "No location"}
                      </td>

                      <td className="px-6 py-4">
                        {supplier.isActive ? (
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
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] transition hover:bg-purple-100"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openDeleteModal(supplier)}
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
          <SupplierFormModal
            form={form}
            setForm={setForm}
            selectedSupplier={selectedSupplier}
            isSaving={isSaving}
            onClose={closeModal}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && selectedSupplier && (
          <DeleteSupplierModal
            supplier={selectedSupplier}
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

function SupplierFormModal({
  form,
  setForm,
  selectedSupplier,
  isSaving,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  selectedSupplier: Supplier | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const isEditMode = !!selectedSupplier;

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
        className="fixed left-1/2 top-1/2 z-[90] max-h-[90vh] w-[94%] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-purple-950/30"
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white">
          <div>
            <h2 className="text-xl font-bold">
              {isEditMode ? "Edit Supplier" : "Create Supplier"}
            </h2>
            <p className="mt-1 text-sm text-purple-100">
              {isEditMode
                ? "Update supplier information."
                : "Add a new supplier record."}
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
              label="Supplier Name"
              icon={Building2}
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              placeholder="Example: ABC Trading LLC"
              required
            />

            <InputField
              label="Contact Person"
              icon={UserRound}
              value={form.contactPerson}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  contactPerson: value,
                }))
              }
              placeholder="Example: John Smith"
            />

            <InputField
              label="Email"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(value) =>
                setForm((current) => ({ ...current, email: value }))
              }
              placeholder="supplier@example.com"
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
              label="Country"
              icon={MapPin}
              value={form.country}
              onChange={(value) =>
                setForm((current) => ({ ...current, country: value }))
              }
              placeholder="UAE"
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
              placeholder="Supplier address..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                isActive: !current.isActive,
              }))
            }
            className="flex w-full items-center justify-between rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Supplier Status
              </p>
              <p className="text-xs text-slate-500">
                Active suppliers can be used for product records.
              </p>
            </div>

            {form.isActive ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                <ToggleRight className="h-4 w-4" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                <ToggleLeft className="h-4 w-4" />
                Inactive
              </span>
            )}
          </button>

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
                  {isEditMode ? "Update Supplier" : "Create Supplier"}
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

function DeleteSupplierModal({
  supplier,
  isDeleting,
  onClose,
  onDelete,
}: {
  supplier: Supplier;
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
          Delete Supplier?
        </h2>

        <p className="mt-3 text-center text-sm leading-6 text-slate-500">
          Are you sure you want to delete{" "}
          <span className="font-bold text-slate-800">{supplier.name}</span>?
          This will soft delete the supplier and disable it from future product
          use.
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

function SupplierTableSkeleton() {
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
