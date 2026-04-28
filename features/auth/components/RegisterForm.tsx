"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerSchema, type RegisterFormData } from "../schemas/auth.schema";
import { signUpWithEmail } from "../services/auth-service";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { useToast } from "@/providers/ToastProvider";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";

async function claimSlugAfterAuth(slug: string) {
  try {
    const { updateSlug, updateOrderFormEnabled } = await import(
      "@/features/receipts/services/receipt.service"
    );
    const result = await updateSlug(slug);
    if (result.success) {
      await updateOrderFormEnabled(true);
    }
  } catch {
    // best-effort — silent fail
  }
  document.cookie = "claimed_slug=; max-age=0; path=/; SameSite=Lax";
}

const PHOTO_MAGIC_PREVIEW_KEY = "photo_magic_preview_v1";

function readPhotoMagicPreview(): unknown | null {
  // Try localStorage first, fall back to cookie
  try {
    const stored = localStorage.getItem(PHOTO_MAGIC_PREVIEW_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // localStorage unavailable
  }
  try {
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("photo_magic_preview="));
    if (match) {
      return JSON.parse(decodeURIComponent(match.slice("photo_magic_preview=".length)));
    }
  } catch {
    // bad cookie payload
  }
  return null;
}

function clearPhotoMagicPreview() {
  try {
    localStorage.removeItem(PHOTO_MAGIC_PREVIEW_KEY);
  } catch {
    // ignore
  }
  document.cookie = "photo_magic_preview=; max-age=0; path=/; SameSite=Lax";
}

async function activatePhotoMagicAfterAuth(): Promise<{
  activated: boolean;
  productsCreated: number;
}> {
  const preview = readPhotoMagicPreview();
  if (!preview) return { activated: false, productsCreated: 0 };

  try {
    const res = await fetch("/api/onboarding/activate-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preview),
    });
    if (!res.ok) {
      return { activated: false, productsCreated: 0 };
    }
    const data = await res.json();
    clearPhotoMagicPreview();
    return {
      activated: !!data.success,
      productsCreated: data.productsCreated ?? 0,
    };
  } catch {
    return { activated: false, productsCreated: 0 };
  }
}

export function RegisterForm({ claimedSlug, referralCode, communityCode }: { claimedSlug?: string; referralCode?: string; communityCode?: string }) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Set referral + community cookies when component mounts
  useEffect(() => {
    if (communityCode) {
      document.cookie = `community_code=${communityCode}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    }
  }, [communityCode]);

  useEffect(() => {
    if (referralCode) {
      document.cookie = `referral_code=${referralCode}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    }
  }, [referralCode]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await signUpWithEmail(data);
      if (error) {
        showError("Sign-up failed", error.message);
        return;
      }

      // If session exists, user is auto-confirmed (email verification disabled)
      if (authData?.session) {
        track("signup", { method: "email", referral: referralCode || undefined });

        // Apply referral + community (email signup doesn't go through /api/auth/callback)
        if (referralCode || communityCode) {
          try {
            await fetch("/api/auth/apply-referral", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referralCode, communityCode }),
            });
          } catch {
            // best-effort
          }
          document.cookie = "referral_code=; max-age=0; path=/; SameSite=Lax";
          document.cookie = "community_code=; max-age=0; path=/; SameSite=Lax";
        }

        // Photo Magic preview takes precedence — it includes business name
        // + products + slug captured on the landing page. If present, activate
        // it and skip the manual /setup wizard.
        const photoMagic = await activatePhotoMagicAfterAuth();

        if (!photoMagic.activated && claimedSlug) {
          await claimSlugAfterAuth(claimedSlug);
        }

        success("Account created!", "Welcome to Tokoflow");

        // If photo magic activated, jump to orders directly (setup is done).
        // Otherwise fall back to manual /setup wizard.
        if (photoMagic.activated && photoMagic.productsCreated > 0) {
          router.push("/today");
        } else {
          router.push("/setup");
        }
      } else {
        // Email verification required
        success(
          "Check your email",
          "We sent a confirmation link to verify your account.",
        );
        router.push("/verify-email");
      }
    } catch {
      showError("Connection failed", "Check your internet and try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {claimedSlug && (
        <div className="mb-4 rounded-xl border border-[#05A660]/20 bg-[#E8F6F0] px-4 py-3 text-center">
          <p className="text-sm text-[#05A660]">
            Link <span className="font-semibold">tokoflow.com/{claimedSlug}</span> will be activated after sign-up
          </p>
        </div>
      )}
      {communityCode && (
        <div className="mb-4 rounded-xl border border-[#05A660]/20 bg-[#E8F6F0] px-4 py-3 text-center">
          <p className="text-sm text-[#05A660]">
            You&apos;ve been invited to a merchant community
          </p>
        </div>
      )}
      {referralCode && !communityCode && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
          <p className="text-sm text-blue-700">
            You&apos;ve been invited to Tokoflow
          </p>
        </div>
      )}
      <div className="bg-white border border-[#E2E8F0] rounded-[2rem] p-8 shadow-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image
              src="/images/logo.png"
              alt={siteConfig.name}
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold text-[#1E293B]">
              {siteConfig.name}
            </span>
          </div>
          <p className="text-sm text-[#475569]">
            Take WhatsApp orders — free to start
          </p>
        </div>

        <div className="space-y-6">
          <SocialAuthButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E2E8F0]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#475569]">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white transition-colors focus-within:border-[#05A660]/25 focus-within:ring-4 focus-within:ring-[#05A660]/8">
                <label htmlFor="fullName" className="block px-3 pt-2 text-[11px] font-medium text-[#475569]">Full name</label>
                <input id="fullName" placeholder="Your full name" {...register("fullName")} disabled={isLoading} className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none disabled:opacity-50" />
              </div>
              {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white transition-colors focus-within:border-[#05A660]/25 focus-within:ring-4 focus-within:ring-[#05A660]/8">
                <label htmlFor="email" className="block px-3 pt-2 text-[11px] font-medium text-[#475569]">Email</label>
                <input id="email" type="email" placeholder="you@example.com" {...register("email")} disabled={isLoading} className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none disabled:opacity-50" />
              </div>
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white transition-colors focus-within:border-[#05A660]/25 focus-within:ring-4 focus-within:ring-[#05A660]/8">
                <label htmlFor="password" className="block px-3 pt-2 text-[11px] font-medium text-[#475569]">Password</label>
                <input id="password" type="password" placeholder="At least 6 characters" {...register("password")} disabled={isLoading} className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none disabled:opacity-50" />
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white transition-colors focus-within:border-[#05A660]/25 focus-within:ring-4 focus-within:ring-[#05A660]/8">
                <label htmlFor="confirmPassword" className="block px-3 pt-2 text-[11px] font-medium text-[#475569]">Confirm password</label>
                <input id="confirmPassword" type="password" {...register("confirmPassword")} disabled={isLoading} className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none disabled:opacity-50" />
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Free trial badge */}
            <div className="bg-[#E8F6F0] border border-[#05A660]/20 rounded-xl p-3 text-center">
              <p className="text-sm text-[#05A660] font-medium">
                Free 50 orders/month — no credit card
              </p>
            </div>

            <Button
              type="submit"
              variant="marketing"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Open a free store
            </Button>
          </form>

          <p className="text-center text-sm text-[#475569]">
            Already have an account?{" "}
            <Link
              href={claimedSlug ? `/login?slug=${encodeURIComponent(claimedSlug)}` : "/login"}
              className="text-[#1E293B] font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-[#475569]">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[#1E293B]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[#1E293B]">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
