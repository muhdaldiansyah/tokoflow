"use client";

/**
 * Phone input with 🇮🇩 +62 prefix.
 * User types: 812 3456 7890 (without 0 or 62)
 * Stored as: 628123456789 (via normalizePhone)
 *
 * Handles legacy values: if value starts with "0" or "62", strips prefix for display.
 */

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  id?: string;
  /** Compact mode — no IFTA label wrapper, just inline prefix */
  compact?: boolean;
}

// Strip prefix for display: "08123" → "8123", "628123" → "8123", "8123" → "8123"
function toDisplayValue(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function PhoneInput({
  value,
  onChange,
  label = "Nomor WhatsApp",
  placeholder = "812 3456 7890",
  error,
  helperText,
  required = false,
  id = "phoneInput",
  compact = false,
}: PhoneInputProps) {
  const displayValue = toDisplayValue(value);

  function handleChange(raw: string) {
    // Only keep digits
    const digits = raw.replace(/\D/g, "");
    // Strip leading 0 or 62 if user pastes full number
    if (digits.startsWith("62")) {
      onChange(digits.slice(2));
    } else if (digits.startsWith("0")) {
      onChange(digits.slice(1));
    } else {
      onChange(digits);
    }
  }

  // Validate: must start with 8, 9-13 digits
  // (exported for use in form validation)
  const isValid = displayValue.length === 0 || (displayValue.startsWith("8") && displayValue.length >= 9 && displayValue.length <= 13);

  if (compact) {
    return (
      <div>
        <div className={`flex items-center h-12 px-3 bg-white border rounded-lg transition-colors focus-within:border-orange-500/40 focus-within:ring-2 focus-within:ring-orange-500/20 ${error ? "border-red-400" : ""}`}>
          <span className="text-sm text-muted-foreground shrink-0 select-none mr-2">🇮🇩 +62</span>
          <span className="w-px h-4 bg-border shrink-0 mr-2" />
          <input
            type="tel"
            id={id}
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-muted-foreground/70 mt-1">{helperText}</p>}
      </div>
    );
  }

  // IFTA label mode (default)
  return (
    <div>
      <div className={`relative rounded-lg border bg-white transition-colors focus-within:border-orange-500/40 focus-within:ring-2 focus-within:ring-orange-500/20 ${error ? "border-red-400" : ""}`}>
        <label htmlFor={id} className="block px-3 pt-2 text-[11px] font-medium text-muted-foreground">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex items-center px-3 pb-2.5 pt-0.5 gap-2">
          <span className="text-sm text-muted-foreground shrink-0 select-none">🇮🇩 +62</span>
          <span className="w-px h-4 bg-border shrink-0" />
          <input
            type="tel"
            id={id}
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-muted-foreground/70 mt-1">{helperText}</p>}
    </div>
  );
}

/** Validate phone (digits only, after stripping prefix). Returns error message or null. */
export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Nomor WhatsApp belum diisi";
  // Strip prefix for validation
  let num = digits;
  if (num.startsWith("62")) num = num.slice(2);
  else if (num.startsWith("0")) num = num.slice(1);
  if (!num.startsWith("8")) return "Nomor harus dimulai dengan 8";
  if (num.length < 9) return "Nomor terlalu pendek";
  if (num.length > 13) return "Nomor terlalu panjang";
  return null;
}

/** Normalize for storage: always returns "628xxx" format */
export function normalizePhoneForStorage(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return "62" + digits;
}
