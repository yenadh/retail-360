// src/app/admin/category/page.tsx

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  FolderTree,
  Loader2,
  Plus,
  Search,
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
  description: string;
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
  description: string;
  isActive: boolean;
};

const initialFormState: FormState = {
  name: "",
  description: "",
  isActive: true,
};

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [form, setForm] = useState<FormState>(initialFormState);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    const keyword = searchText.toLowerCase().trim();

    if (!keyword) return categories;

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(keyword) ||
        category.slug.toLowerCase().includes(keyword) ||
        category.description.toLowerCase().includes(keyword)
      );
    });
  }, [categories, searchText]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((item) => item.isActive).length;
  const inactiveCategories = categories.filter((item) => !item.isActive).length;

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<Category[]> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Failed to load categories");
        return;
      }

      setCategories(result.data);
    } catch {
      setError("Something went wrong while loading categories");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setSelectedCategory(null);
    setForm(initialFormState);
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setSelectedCategory(category);
    setForm({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openDeleteModal(category: Category) {
    setSelectedCategory(category);
    setError("");
    setMessage("");
    setDeleteModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;

    setModalOpen(false);
    setSelectedCategory(null);
    setForm(initialFormState);
  }

  function closeDeleteModal() {
    if (isDeleting) return;

    setDeleteModalOpen(false);
    setSelectedCategory(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const isEditMode = !!selectedCategory;

      const response = await fetch(
        isEditMode
          ? `/api/categories/${selectedCategory._id}`
          : "/api/categories",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const result: ApiResponse<Category> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to save category");
        return;
      }

      setMessage(result.message);
      setModalOpen(false);
      setSelectedCategory(null);
      setForm(initialFormState);

      await loadCategories();
    } catch {
      setError("Something went wrong while saving category");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedCategory) return;

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/categories/${selectedCategory._id}`, {
        method: "DELETE",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to delete category");
        return;
      }

      setMessage(result.message);
      setDeleteModalOpen(false);
      setSelectedCategory(null);

      await loadCategories();
    } catch {
      setError("Something went wrong while deleting category");
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
                <FolderTree className="h-4 w-4" />
                Admin Category Management
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Product Categories
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-purple-100">
                Manage product categories used in the online retail store.
                Categories help organize products and improve customer browsing.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              Add Category
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Categories"
            value={totalCategories}
            description="Available category records"
          />
          <StatCard
            title="Active Categories"
            value={activeCategories}
            description="Visible for product management"
          />
          <StatCard
            title="Inactive Categories"
            value={inactiveCategories}
            description="Hidden or disabled categories"
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
                Category List
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View, search, create, update and soft delete categories.
              </p>
            </div>

            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-96">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search category..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <CategoryTableSkeleton />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 text-[#7C3AED]">
                <FolderTree className="h-8 w-8" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                No categories found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Create your first category to organize products in the retail
                system.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((category, index) => (
                    <motion.tr
                      key={category._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="transition hover:bg-purple-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                            <FolderTree className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {category.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {category._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {category.slug}
                        </span>
                      </td>

                      <td className="max-w-xs px-6 py-4">
                        <p className="line-clamp-2 text-sm text-slate-500">
                          {category.description || "No description"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {category.isActive ? (
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
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED] transition hover:bg-purple-100"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openDeleteModal(category)}
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
          <CategoryFormModal
            form={form}
            setForm={setForm}
            selectedCategory={selectedCategory}
            isSaving={isSaving}
            onClose={closeModal}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && selectedCategory && (
          <DeleteCategoryModal
            category={selectedCategory}
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
}: {
  title: string;
  value: number;
  description: string;
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
          <FolderTree className="h-6 w-6" />
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-500">{description}</p>
    </motion.div>
  );
}

function CategoryFormModal({
  form,
  setForm,
  selectedCategory,
  isSaving,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  selectedCategory: Category | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const isEditMode = !!selectedCategory;

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
        className="fixed left-1/2 top-1/2 z-[90] w-[92%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-purple-950/30"
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] p-6 text-white">
          <div>
            <h2 className="text-xl font-bold">
              {isEditMode ? "Edit Category" : "Create Category"}
            </h2>
            <p className="mt-1 text-sm text-purple-100">
              {isEditMode
                ? "Update existing category details."
                : "Add a new product category."}
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

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Category Name
            </label>

            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              placeholder="Example: Electronics"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#8B5CF6] focus:bg-white"
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
              placeholder="Short description about this category..."
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
                Category Status
              </p>
              <p className="text-xs text-slate-500">
                Active categories can be used for products.
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

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                  {isEditMode ? "Update Category" : "Create Category"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function DeleteCategoryModal({
  category,
  isDeleting,
  onClose,
  onDelete,
}: {
  category: Category;
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
          Delete Category?
        </h2>

        <p className="mt-3 text-center text-sm leading-6 text-slate-500">
          Are you sure you want to delete{" "}
          <span className="font-bold text-slate-800">{category.name}</span>?
          This will soft delete the category and hide it from the active list.
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

function CategoryTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="grid animate-pulse grid-cols-6 gap-4 rounded-2xl border border-slate-100 p-4"
        >
          <div className="col-span-2 h-8 rounded-xl bg-slate-100" />
          <div className="h-8 rounded-xl bg-slate-100" />
          <div className="col-span-2 h-8 rounded-xl bg-slate-100" />
          <div className="h-8 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
