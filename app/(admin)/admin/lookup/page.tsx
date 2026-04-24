"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X, Loader2, Check, Database } from "lucide-react";

interface LookupItem {
  id: string;
  label: string;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  // cities extra fields
  name?: string;
  slug?: string;
  province?: string;
}

type TableType = "categories" | "units" | "cities";

const TABLE_CONFIG: Record<TableType, { title: string; idEditable: boolean; fields: { key: string; label: string; type: string }[] }> = {
  categories: {
    title: "Kategori Bisnis",
    idEditable: true,
    fields: [
      { key: "id", label: "ID (slug)", type: "text" },
      { key: "label", label: "Label", type: "text" },
      { key: "icon", label: "Icon (opsional)", type: "text" },
      { key: "sort_order", label: "Urutan", type: "number" },
    ],
  },
  units: {
    title: "Satuan Produk",
    idEditable: true,
    fields: [
      { key: "id", label: "ID", type: "text" },
      { key: "label", label: "Label", type: "text" },
      { key: "sort_order", label: "Urutan", type: "number" },
    ],
  },
  cities: {
    title: "Kota",
    idEditable: false,
    fields: [
      { key: "name", label: "Nama Kota", type: "text" },
      { key: "slug", label: "Slug", type: "text" },
      { key: "province", label: "Provinsi", type: "text" },
      { key: "sort_order", label: "Urutan", type: "number" },
    ],
  },
};

export default function AdminLookupPage() {
  const [activeTab, setActiveTab] = useState<TableType>("categories");
  const [items, setItems] = useState<LookupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const config = TABLE_CONFIG[activeTab];

  async function loadItems() {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/lookup?type=${activeTab}`);
      if (res.ok) setItems(await res.json());
    } catch {
      setError("Gagal memuat data");
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadItems();
    setEditingId(null);
    setIsAdding(false);
  }, [activeTab]);

  const handleEdit = (item: LookupItem) => {
    setEditingId(item.id);
    const form: Record<string, string> = {};
    config.fields.forEach((f) => {
      form[f.key] = String((item as unknown as Record<string, unknown>)[f.key] || "");
    });
    setEditForm(form);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const updates: Record<string, unknown> = {};
      config.fields.forEach((f) => {
        if (f.key === "id") return; // can't change ID
        updates[f.key] = f.type === "number" ? Number(editForm[f.key] || 0) : editForm[f.key];
      });
      const res = await fetch("/api/admin/lookup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, id: editingId, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan");
      } else {
        setEditingId(null);
        await loadItems();
      }
    } catch {
      setError("Gagal menyimpan");
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    setSaving(true);
    setError("");
    try {
      const item: Record<string, unknown> = { type: activeTab };
      config.fields.forEach((f) => {
        item[f.key] = f.type === "number" ? Number(addForm[f.key] || 0) : addForm[f.key];
      });
      const res = await fetch("/api/admin/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menambah");
      } else {
        setIsAdding(false);
        setAddForm({});
        await loadItems();
      }
    } catch {
      setError("Gagal menambah");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Nonaktifkan "${label}"?`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/lookup?type=${activeTab}&id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menghapus");
      } else {
        await loadItems();
      }
    } catch {
      setError("Gagal menghapus");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold text-foreground">Lookup Tables</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(Object.keys(TABLE_CONFIG) as TableType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {TABLE_CONFIG[tab].title}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <span className="text-sm font-medium text-foreground">{config.title}</span>
          <button
            onClick={() => { setIsAdding(true); setAddForm({}); setEditingId(null); }}
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Add form */}
            {isAdding && (
              <div className="px-4 py-3 bg-green-50/50">
                <div className="flex flex-wrap items-end gap-3">
                  {config.fields.map((f) => (
                    <div key={f.key} className="flex-1 min-w-[120px]">
                      <label className="text-[11px] text-muted-foreground mb-1 block">{f.label}</label>
                      <input
                        type={f.type}
                        value={addForm[f.key] || ""}
                        onChange={(e) => setAddForm({ ...addForm, [f.key]: e.target.value })}
                        className="w-full h-9 px-2.5 text-sm bg-white border rounded-md"
                        placeholder={f.label}
                      />
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <button onClick={handleAdd} disabled={saving} className="h-9 w-9 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setIsAdding(false)} className="h-9 w-9 flex items-center justify-center rounded-md bg-card border border-border hover:bg-muted">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            {items.length === 0 && !isAdding && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada data
              </div>
            )}

            {items.map((item) => (
              <div key={item.id} className="px-4 py-3">
                {editingId === item.id ? (
                  /* Edit mode */
                  <div className="flex flex-wrap items-end gap-3">
                    {config.fields.map((f) => (
                      <div key={f.key} className="flex-1 min-w-[120px]">
                        <label className="text-[11px] text-muted-foreground mb-1 block">{f.label}</label>
                        <input
                          type={f.type}
                          value={editForm[f.key] || ""}
                          onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                          disabled={f.key === "id"}
                          className="w-full h-9 px-2.5 text-sm bg-white border rounded-md disabled:opacity-50 disabled:bg-muted"
                        />
                      </div>
                    ))}
                    <div className="flex gap-1.5">
                      <button onClick={handleSaveEdit} disabled={saving} className="h-9 w-9 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditingId(null)} className="h-9 w-9 flex items-center justify-center rounded-md bg-card border border-border hover:bg-muted">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-muted-foreground w-8">{item.sort_order}</span>
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {activeTab === "cities" ? item.name : item.label}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {activeTab === "cities" ? item.slug : item.id}
                        </span>
                        {activeTab === "cities" && item.province && (
                          <span className="text-xs text-muted-foreground ml-2">({item.province})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(item)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.label || item.name || "")} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
