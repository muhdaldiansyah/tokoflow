"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, ArrowRight } from "lucide-react";
import { isValidSlug, isReservedSlug } from "@/lib/utils/slug";
import { track } from "@/lib/analytics";

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

export function ClaimSlugInput() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const checkSlug = useCallback(async (value: string) => {
    if (!isValidSlug(value)) {
      setStatus("invalid");
      return;
    }
    if (isReservedSlug(value)) {
      setStatus("taken");
      return;
    }

    setStatus("checking");
    try {
      const res = await fetch(`/api/slug/check?slug=${encodeURIComponent(value)}`);
      const data = await res.json();
      setStatus(data.available ? "available" : "taken");
    } catch {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(value);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!value || value.length < 3) {
      setStatus(value.length > 0 ? "invalid" : "idle");
      return;
    }

    setStatus("idle");
    timerRef.current = setTimeout(() => checkSlug(value), 500);
  }

  function handleClaim() {
    if (status !== "available") return;
    document.cookie = `claimed_slug=${slug}; max-age=600; path=/; SameSite=Lax`;
    track("slug_claimed", { slug });
    router.push(`/login?slug=${encodeURIComponent(slug)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && status === "available") {
      handleClaim();
    }
  }

  const statusMessage = {
    idle: null,
    checking: null,
    available: (
      <p className="text-sm text-[#05A660]">
        Available! Claim it before someone else does.
      </p>
    ),
    taken: (
      <p className="text-sm text-red-500">
        Already taken. Try another name.
      </p>
    ),
    invalid: (
      <p className="text-sm text-red-500">
        At least 3 characters. Lowercase letters, numbers, and dash (-) only.
      </p>
    ),
  };

  const statusIcon = {
    idle: null,
    checking: <Loader2 className="h-[18px] w-[18px] sm:h-4 sm:w-4 animate-spin text-[#94A3B8]" />,
    available: <Check className="h-[18px] w-[18px] sm:h-4 sm:w-4 text-[#05A660]" />,
    taken: <X className="h-[18px] w-[18px] sm:h-4 sm:w-4 text-red-500" />,
    invalid: <X className="h-[18px] w-[18px] sm:h-4 sm:w-4 text-red-500" />,
  };

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 flex items-center py-[18px] sm:py-0 sm:h-12 bg-white border-2 sm:border border-[#E2E8F0] rounded-xl sm:rounded-lg shadow-sm px-4 sm:px-3">
          <span className="text-lg leading-none sm:text-sm sm:leading-normal text-[#94A3B8] shrink-0 select-none">
            tokoflow.com/
          </span>
          <input
            type="text"
            value={slug}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="your-business"
            maxLength={50}
            className="flex-1 min-w-0 bg-transparent outline-none text-lg leading-none sm:text-sm sm:leading-normal text-[#1E293B] placeholder:text-[#CBD5E1]"
          />
          {slug && (
            <span className="ml-2 shrink-0">{statusIcon[status]}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={status !== "available"}
          className="py-[20px] sm:py-0 sm:h-12 px-6 sm:px-5 rounded-xl sm:rounded-lg bg-[#05A660] text-white text-lg leading-none sm:text-sm sm:leading-normal font-semibold shadow-lg shadow-[#05A660]/20 hover:bg-[#048C51] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          Claim free link
          <ArrowRight className="h-[18px] w-[18px] sm:h-4 sm:w-4" />
        </button>
      </div>
      <div className="h-6 mt-1.5 flex items-center justify-center lg:justify-start">
        {statusMessage[status]}
      </div>
    </div>
  );
}
