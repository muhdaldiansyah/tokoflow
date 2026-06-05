"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { getCustomers } from "../services/customer.service";
import type { Customer } from "../types/customer.types";

interface CustomerPickerProps {
  customerName: string;
  customerPhone: string;
  onSelect: (name: string, phone: string) => void;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  compact?: boolean;
}

export function CustomerPicker({
  customerName,
  customerPhone,
  onSelect,
  onNameChange,
  onPhoneChange,
  compact,
}: CustomerPickerProps) {
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [debouncedPhone, setDebouncedPhone] = useState(customerPhone);
  const [debouncedName, setDebouncedName] = useState(customerName);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

  const hasData = !!(customerName && customerPhone);
  const inputClass = "w-full h-11 px-3 bg-muted/50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-colors placeholder:text-muted-foreground";
  const showCompact = compact && hasData && !isEditing;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPhone(customerPhone), 300);
    return () => clearTimeout(timer);
  }, [customerPhone]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(customerName), 300);
    return () => clearTimeout(timer);
  }, [customerName]);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debouncedName.length >= 2) {
      searchCustomers(debouncedName);
    } else if (debouncedPhone.length >= 3) {
      searchCustomers(debouncedPhone);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedPhone, debouncedName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function searchCustomers(query: string) {
    const results = await getCustomers(query);
    setSuggestions(results.slice(0, 5));
    if (results.length > 0) {
      setShowSuggestions(true);
    }
  }

  function handleSelectCustomer(customer: Customer) {
    justSelectedRef.current = true;
    onSelect(customer.name, customer.phone || "");
    setSuggestions([]);
    setShowSuggestions(false);
    setIsEditing(false);
  }

  if (showCompact) {
    return (
      <div className="flex items-center justify-between py-1">
        <div className="text-sm text-foreground">
          <span className="font-medium">{customerName}</span>
          <span className="text-muted-foreground mx-1">&middot;</span>
          <span className="text-muted-foreground">{customerPhone}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-2.5 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="relative">
        <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
          <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">Customer name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => onNameChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Type name..."
            className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelectCustomer(customer)}
                className="w-full text-left px-3 py-3 hover:bg-muted active:bg-muted/80 border-b last:border-0 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">{customer.name}</p>
                {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:bg-background">
        <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">WhatsApp number</label>
        <div className="flex items-center px-3 pb-2 pt-0 gap-1.5">
          <span className="text-sm text-muted-foreground shrink-0 select-none">🇲🇾+60</span>
          <span className="w-px h-3.5 bg-border shrink-0" />
          <input
            type="tel"
            value={(() => { const d = customerPhone.replace(/\D/g, ""); return d.startsWith("60") ? d.slice(2) : d.startsWith("0") ? d.slice(1) : d; })()}
            onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); onPhoneChange(d.startsWith("0") ? d.slice(1) : d.startsWith("60") ? d.slice(2) : d); }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="12 345 6789"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
