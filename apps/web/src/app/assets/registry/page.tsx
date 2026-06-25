"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { 
  Package, Plus, Search, Filter, Edit, Trash2, 
  Settings, CheckCircle, AlertTriangle, X, ShieldAlert 
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function AssetRegistryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("assets.registry");

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  // Filters & Search states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  // Form Fields
  const [assetNumber, setAssetNumber] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("laptop");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [vendor, setVendor] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [condition, setCondition] = useState("new");
  const [status, setStatus] = useState("available");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Assets
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["assets-registry-list", search, categoryFilter, statusFilter, conditionFilter, page],
    queryFn: async () => {
      let url = `/assets?page=${page}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (conditionFilter) url += `&condition=${conditionFilter}`;
      const res = await api.get(url);
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const createAssetMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post("/assets", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets-registry-list"] });
      queryClient.invalidateQueries({ queryKey: ["assets-dashboard-list"] });
      toast.success("Asset registered successfully!");
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to register asset.");
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await api.put(`/assets/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets-registry-list"] });
      queryClient.invalidateQueries({ queryKey: ["assets-dashboard-list"] });
      toast.success("Asset updated successfully!");
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update asset.");
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets-registry-list"] });
      queryClient.invalidateQueries({ queryKey: ["assets-dashboard-list"] });
      toast.success("Asset deleted successfully.");
    },
    onError: () => {
      toast.error("Failed to delete asset.");
    }
  });

  const resetForm = () => {
    setEditingAsset(null);
    setAssetNumber("");
    setName("");
    setCategory("laptop");
    setBrand("");
    setModel("");
    setSerialNumber("");
    setSpecifications("");
    setPurchaseDate("");
    setPurchasePrice("");
    setVendor("");
    setWarrantyExpiry("");
    setCondition("new");
    setStatus("available");
    setLocation("");
    setNotes("");
  };

  const handleOpenCreateModal = () => {
    resetForm();
    // Auto-generate temporary tag if empty
    setAssetNumber("AST-" + Math.floor(1000 + Math.random() * 9000));
    setShowModal(true);
  };

  const handleOpenEditModal = (asset: any) => {
    setEditingAsset(asset);
    setAssetNumber(asset.asset_number || "");
    setName(asset.name || "");
    setCategory(asset.category || "laptop");
    setBrand(asset.brand || "");
    setModel(asset.model || "");
    setSerialNumber(asset.serial_number || "");
    setSpecifications(asset.specifications || "");
    setPurchaseDate(asset.purchase_date || "");
    setPurchasePrice(asset.purchase_price ? String(asset.purchase_price) : "");
    setVendor(asset.vendor || "");
    setWarrantyExpiry(asset.warranty_expiry || "");
    setCondition(asset.condition || "new");
    setStatus(asset.status || "available");
    setLocation(asset.location || "");
    setNotes(asset.notes || "");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetNumber.trim()) {
      toast.warning("Asset number is required.");
      return;
    }
    if (!name.trim()) {
      toast.warning("Asset name is required.");
      return;
    }

    const payload = {
      asset_number: assetNumber,
      name,
      category,
      brand: brand || null,
      model: model || null,
      serial_number: serialNumber || null,
      specifications: specifications || null,
      purchase_date: purchaseDate || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      vendor: vendor || null,
      warranty_expiry: warrantyExpiry || null,
      condition,
      status,
      location: location || null,
      notes: notes || null,
    };

    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, payload });
    } else {
      createAssetMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this asset? This action will permanently remove it from inventory logs.")) {
      deleteAssetMutation.mutate(id);
    }
  };

  if (!mounted || !isAuthenticated) return null;

  const assets = assetsData?.data || [];
  const meta = assetsData?.meta || { last_page: 1, current_page: 1 };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("title")}
        subtitle="Kelola registries aset fisik milik korporasi"
        backUrl="/assets"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Actions panel */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl px-3 py-2 w-full max-w-xs shadow-sm">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="text-xs bg-transparent border-none outline-none w-full text-zinc-900 dark:text-zinc-50 focus:ring-0"
            />
          </div>

          {/* Add asset button */}
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto"
            >
              <Plus className="h-4 w-4" />
              {t("addBtn")}
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="monitor">Monitor</option>
              <option value="phone">Phone</option>
              <option value="tablet">Tablet</option>
              <option value="sim_card">Sim Card</option>
              <option value="vehicle">Vehicle</option>
              <option value="furniture">Furniture</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="disposed">Disposed</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Physical Condition</span>
            <select
              value={conditionFilter}
              onChange={(e) => { setConditionFilter(e.target.value); setPage(1); }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
            >
              <option value="">All Conditions</option>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
        </div>

        {/* Registry Table */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-medium select-none">
                  <th className="p-4">Tag Number</th>
                  <th className="p-4">Asset Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Brand / Model</th>
                  <th className="p-4">Physical Condition</th>
                  <th className="p-4">Status</th>
                  {isAdmin && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="animate-spin h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-500 italic">
                      No assets found. Click "Daftarkan Aset" to begin.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset: any) => (
                    <tr key={asset.id} className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20">
                      <td className="p-4 font-bold text-zinc-950 dark:text-zinc-50">
                        {asset.asset_number}
                      </td>
                      <td className="p-4 font-medium">{asset.name}</td>
                      <td className="p-4 capitalize">{asset.category}</td>
                      <td className="p-4">
                        {asset.brand ? `${asset.brand} ` : ""}{asset.model || "-"}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          asset.condition === "new" || asset.condition === "good"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                            : asset.condition === "fair"
                            ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600"
                            : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                        }`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          asset.status === "available"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                            : asset.status === "assigned"
                            ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(asset)}
                              className="h-7 w-7 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer border border-zinc-100 dark:border-zinc-900"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset.id)}
                              className="h-7 w-7 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-rose-500 flex items-center justify-center cursor-pointer border border-zinc-100 dark:border-zinc-900"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="text-zinc-500 font-medium">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                disabled={page >= meta.last_page}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </main>

      {/* Asset Form Modal (Register & Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-enter my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {editingAsset ? t("modal.editTitle") : t("modal.title")}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Row 1: Tag & Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.number")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={assetNumber}
                    onChange={(e) => setAssetNumber(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.name")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. MacBook Pro M3 Starlight"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Category & Brand */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.category")}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="laptop">Laptop</option>
                    <option value="desktop">Desktop</option>
                    <option value="monitor">Monitor</option>
                    <option value="phone">Phone</option>
                    <option value="tablet">Tablet</option>
                    <option value="sim_card">Sim Card</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="furniture">Furniture</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.brand")}
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Apple"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.model")}
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. A2941"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Serial & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.serial")}
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Serial Number"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.location")}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Head Office Floor 3"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.specs")}
                </label>
                <textarea
                  rows={2}
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="e.g., M3 Max, 36GB RAM, 1TB SSD"
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-50 focus:outline-none leading-normal"
                />
              </div>

              {/* Row 4: Purchase details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.purchaseDate")}
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.price")}
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="Purchase Price"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.vendor")}
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Vendor Name"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Warranty & Conditions & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    value={warrantyExpiry}
                    onChange={(e) => setWarrantyExpiry(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.condition")}
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.status")}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="disposed">Disposed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Internal Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes..."
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-50 focus:outline-none leading-normal"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-900/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAssetMutation.isPending || updateAssetMutation.isPending}
                  className="px-4 py-2 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t("modal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
