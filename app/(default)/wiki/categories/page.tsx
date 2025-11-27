"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  FolderIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { toast, Toaster } from "react-hot-toast";

interface WikiCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  children: WikiCategory[];
  articles: { id: string }[];
}

export default function WikiCategoriesPage() {
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WikiCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<WikiCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    parentId: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/wiki/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        const allIds = new Set<string>();
        data.forEach((cat: WikiCategory) => {
          if (cat.children?.length > 0) {
            allIds.add(cat.id);
          }
        });
        setExpandedCategories(allIds);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const buildCategoryTree = (cats: WikiCategory[]): WikiCategory[] => {
    const map = new Map<string, WikiCategory>();
    const roots: WikiCategory[] = [];

    cats.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    cats.forEach((cat) => {
      const current = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  };

  const toggleExpanded = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openCreateModal = (parentId?: string) => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      icon: "",
      parentId: parentId || "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: WikiCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      parentId: category.parentId || "",
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (category: WikiCategory) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingCategory
        ? `/api/wiki/categories/${editingCategory.id}`
        : "/api/wiki/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon || null,
          parentId: formData.parentId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save category");
      }

      toast.success(editingCategory ? "Category updated" : "Category created");
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/wiki/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast.success("Category deleted");
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const flatCategories = categories.filter((c) => !c.parentId);

  const renderCategory = (category: WikiCategory, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 ${
            depth > 0 ? "border-l-2 border-gray-200" : ""
          }`}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <FolderIcon className="h-5 w-5 text-violet-500" />
            <div>
              <p className="font-medium text-gray-900">{category.name}</p>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 mr-2">
              {category.articles?.length || 0} articles
            </span>
            <button
              onClick={() => openCreateModal(category.id)}
              className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
              title="Add subcategory"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => openEditModal(category)}
              className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
              title="Edit"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => openDeleteModal(category)}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const categoryTree = buildCategoryTree(categories);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Wiki Categories</h2>
            <p className="text-sm text-gray-500">
              Organize your wiki articles into categories and subcategories
            </p>
          </div>
          <button
            onClick={() => openCreateModal()}
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {categoryTree.length === 0 ? (
          <div className="p-8 text-center">
            <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No categories yet</p>
            <button
              onClick={() => openCreateModal()}
              className="mt-3 text-violet-600 hover:text-violet-700 text-sm font-medium"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categoryTree.map((category) => renderCategory(category))}
          </div>
        )}
      </div>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                    {editingCategory ? "Edit Category" : "Create Category"}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input w-full"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        className="form-textarea w-full"
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Parent Category
                      </label>
                      <select
                        className="form-select w-full"
                        value={formData.parentId}
                        onChange={(e) =>
                          setFormData({ ...formData, parentId: e.target.value })
                        }
                      >
                        <option value="">None (Top Level)</option>
                        {categories
                          .filter((c) => c.id !== editingCategory?.id)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Icon (emoji or icon name)
                      </label>
                      <input
                        type="text"
                        className="form-input w-full"
                        value={formData.icon}
                        onChange={(e) =>
                          setFormData({ ...formData, icon: e.target.value })
                        }
                        placeholder="📚 or folder"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn bg-violet-500 hover:bg-violet-600 text-white"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : editingCategory ? "Update" : "Create"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                      <TrashIcon className="h-5 w-5 text-rose-600" />
                    </div>
                    <div className="ml-4">
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Delete Category
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-gray-500">
                        Are you sure you want to delete "{categoryToDelete?.name}"?
                        {categoryToDelete?.children?.length ? (
                          <span className="block mt-1 text-rose-600">
                            This category has subcategories that will also be affected.
                          </span>
                        ) : null}
                        {(categoryToDelete?.articles?.length || 0) > 0 && (
                          <span className="block mt-1 text-rose-600">
                            This category contains {categoryToDelete?.articles?.length} articles.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="btn bg-white border-gray-200 hover:border-gray-300 text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="btn bg-rose-500 hover:bg-rose-600 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
