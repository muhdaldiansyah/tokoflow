"use client";

/**
 * Price input with auto thousand separator (Indonesian format: 25.000)
 * Stores raw number, displays formatted.
 */

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Format: 25000 → "25.000"
function formatPrice(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits).toLocaleString("en-MY");
}

// Parse: "25.000" → "25000"
function parsePrice(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

export function PriceInput({ value, onChange, placeholder = "25.000" }: PriceInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatPrice(value)}
      onChange={(e) => onChange(parsePrice(e.target.value))}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
    />
  );
}

export { formatPrice, parsePrice };
