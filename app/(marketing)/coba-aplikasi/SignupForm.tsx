"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

// Mirrors business_categories labels from migration 080 so trial-signup vocab
// matches the onboarding picker. Keep in sync.
const BUSINESS_TYPES = [
  "Catering & Nasi Box",
  "Bakery & Bread",
  "Custom Cake & Kuih",
  "Snack Box & Hampers",
  "Frozen Food",
  "Kopitiam & Food Stall",
  "Drinks & Coffee",
  "Apparel & Custom Print",
  "Tailor & Alterations",
  "Printing & Signage",
  "Crafts & Souvenir",
  "Furniture & Interior",
  "Cosmetics & Skincare",
  "Photography & Videography",
  "MUA & Beauty",
  "Wedding & Event Planner",
  "Laundry & Dry Clean",
  "Equipment Rental",
  "Electronics Repair",
  "Automotive Service",
  "Tuition & Education",
  "Design Services",
  "Wholesale & Supplier",
  "Other",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-sm transition-colors focus-within:ring-2 focus-within:ring-[#05A660]/20 focus-within:border-[#05A660]/30">
      <label className="block px-3 pt-1.5 text-[10px] font-medium text-[#94A3B8]">{label}</label>
      {children}
    </div>
  );
}

function SearchableSelect({ label, placeholder, options, value, onChange }: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-sm transition-colors focus-within:ring-2 focus-within:ring-[#05A660]/20 focus-within:border-[#05A660]/30">
        <label className="block px-3 pt-1.5 text-[10px] font-medium text-[#94A3B8]">{label}</label>
        <button
          type="button"
          onClick={() => { setOpen(!open); setQuery(""); }}
          className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-left flex items-center justify-between"
        >
          <span className={value ? "text-[#1E293B]" : "text-[#CBD5E1]"}>
            {value || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E2E8F0]">
            <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#CBD5E1] text-[#1E293B]"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[#E8F6F0] transition-colors ${opt === value ? "bg-[#E8F6F0] font-medium text-[#1E293B]" : "text-[#475569]"}`}
              >
                {opt}
              </button>
            )) : (
              <p className="px-3 py-3 text-sm text-[#94A3B8]">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignupForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    business_type: "",
    business_type_other: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.email || !form.business_type) {
      setError("All fields are required.");
      return;
    }
    if (form.business_type === "Other" && !form.business_type_other) {
      setError("Describe your business type.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/programs/coba-aplikasi/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          business_type: form.business_type === "Other" ? form.business_type_other : form.business_type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign-up failed. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Connection failed. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#05A660]">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#1E293B]">Sign-up received!</h3>
        <p className="mt-2 text-sm text-[#475569] leading-relaxed">
          Thanks, <strong>{form.name}</strong>. We&apos;ll reach out via WhatsApp at <strong>{form.phone}</strong> in 1-2 days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Full name *">
        <input
          type="text"
          required
          placeholder="e.g. Aina Binti Ahmad"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-[#1E293B] placeholder:text-[#CBD5E1] focus:outline-none"
        />
      </Field>

      <Field label="WhatsApp number *">
        <div className="flex items-center px-3 pb-2 pt-0 gap-2">
          <span className="text-sm text-[#94A3B8] shrink-0 select-none">{"\u{1F1F2}\u{1F1FE}"} +60</span>
          <span className="w-px h-4 bg-[#E2E8F0] shrink-0" />
          <input
            type="tel"
            required
            placeholder="12 3456 7890"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-transparent text-sm text-[#1E293B] placeholder:text-[#CBD5E1] focus:outline-none"
          />
        </div>
      </Field>

      <Field label="Email *">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-[#1E293B] placeholder:text-[#CBD5E1] focus:outline-none"
        />
      </Field>

      <SearchableSelect
        label="Business type *"
        placeholder="Choose a business type"
        options={BUSINESS_TYPES}
        value={form.business_type}
        onChange={(val) => setForm({ ...form, business_type: val, business_type_other: val === "Other" ? form.business_type_other : "" })}
      />

      {form.business_type === "Other" && (
        <Field label="Describe your business *">
          <input
            type="text"
            required
            placeholder="e.g. Camping gear rental"
            value={form.business_type_other}
            onChange={(e) => setForm({ ...form, business_type_other: e.target.value })}
            className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-[#1E293B] placeholder:text-[#CBD5E1] focus:outline-none"
          />
        </Field>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-lg bg-[#05A660] text-white font-semibold text-sm hover:bg-[#048C51] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
      >
        {loading ? "Signing up..." : "Sign up"}
      </button>

      <p className="text-center text-[10px] text-[#94A3B8]">
        Limited spots
      </p>
    </form>
  );
}
