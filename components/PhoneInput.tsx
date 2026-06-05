"use client";

/**
 * Phone input with 🇲🇾 +60 prefix.
 * User types: 12 345 6789 (without 0 or 60)
 * Stored as: 60123456789 (via normalizePhone)
 *
 * Handles legacy values: if value starts with "0" or "60", strips prefix for display.
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

// Strip prefix for display: "0123456789" → "123456789", "60123456789" → "123456789"
function toDisplayValue(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("60")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function PhoneInput({
  value,
  onChange,
  label = "WhatsApp number",
  placeholder = "12 345 6789",
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
    // Strip leading 0 or 60 if user pastes full number
    if (digits.startsWith("60")) {
      onChange(digits.slice(2));
    } else if (digits.startsWith("0")) {
      onChange(digits.slice(1));
    } else {
      onChange(digits);
    }
  }

  if (compact) {
    return (
      <div>
        <div className={`flex items-center h-12 px-3 bg-white border rounded-lg transition-colors focus-within:border-orange-500/40 focus-within:ring-2 focus-within:ring-orange-500/20 ${error ? "border-red-400" : ""}`}>
          <span className="text-sm text-muted-foreground shrink-0 select-none mr-2">🇲🇾 +60</span>
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
          <span className="text-sm text-muted-foreground shrink-0 select-none">🇲🇾 +60</span>
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

/**
 * Validate a Malaysian mobile phone. Returns an error message or null.
 * Malaysian mobile numbers start with 1 (after the +60 prefix) and the local
 * portion is 9 or 10 digits — total 10–11 digits including the leading 0.
 */
export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "WhatsApp number is required";
  // Strip prefix for validation
  let num = digits;
  if (num.startsWith("60")) num = num.slice(2);
  else if (num.startsWith("0")) num = num.slice(1);
  if (!num.startsWith("1")) return "Number must start with 1 (e.g. 012, 013, 016)";
  if (num.length < 9) return "Number is too short";
  if (num.length > 10) return "Number is too long";
  return null;
}

/** Normalize for storage: always returns "60xxx" (e.g. 60123456789). */
export function normalizePhoneForStorage(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("60")) return digits;
  if (digits.startsWith("0")) return "60" + digits.slice(1);
  if (digits.startsWith("1")) return "60" + digits;
  return "60" + digits;
}
