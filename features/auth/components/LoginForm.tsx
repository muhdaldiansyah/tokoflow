"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormData } from "../schemas/auth.schema";
import { signInWithEmail } from "../services/auth-service";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { useToast } from "@/providers/ToastProvider";
import { siteConfig } from "@/config/site";

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

export function LoginForm({ claimedSlug }: { claimedSlug?: string }) {
  const router = useRouter();
  const { error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signInWithEmail(data);
      if (error) {
        showError("Login failed", error.message);
        return;
      }
      if (claimedSlug) {
        await claimSlugAfterAuth(claimedSlug);
      }
      router.push("/today");
      router.refresh();
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
            Link <span className="font-semibold">tokoflow.com/{claimedSlug}</span> will be activated after you sign in
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
            Sign in to your store
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
                <label htmlFor="email" className="block px-3 pt-2 text-[11px] font-medium text-[#475569]">Email</label>
                <input id="email" type="email" placeholder="you@example.com" {...register("email")} disabled={isLoading} className="w-full px-3 pb-2.5 pt-0.5 bg-transparent text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none disabled:opacity-50" />
              </div>
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#475569]">Password</span>
                <Link href="/forgot-password" className="text-[11px] text-[#475569] hover:text-[#1E293B] transition-colors">Forgot password?</Link>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white transition-colors focus-within:border-[#05A660]/25 focus-within:ring-4 focus-within:ring-[#05A660]/8">
                <input id="password" type="password" {...register("password")} disabled={isLoading} className="w-full h-11 px-3 bg-transparent text-sm text-[#1E293B] focus:outline-none disabled:opacity-50" />
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              variant="marketing"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-[#475569]">
            Don&apos;t have an account?{" "}
            <Link
              href={claimedSlug ? `/register?slug=${encodeURIComponent(claimedSlug)}` : "/register"}
              className="text-[#1E293B] font-medium hover:underline"
            >
              Open a free store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
