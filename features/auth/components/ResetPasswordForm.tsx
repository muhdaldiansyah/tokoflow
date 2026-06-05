"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../schemas/auth.schema";
import { useToast } from "@/providers/ToastProvider";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionFailed, setSessionFailed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout>;

    // Listen for PASSWORD_RECOVERY event (in case exchange hasn't happened yet)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also poll for existing session (in case event already fired before mount)
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Retry once more after a short delay for detectSessionInUrl to finish
        timeout = setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setSessionReady(true);
          } else {
            setSessionFailed(true);
          }
        }, 2000);
      }
    }
    checkSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) {
        showError("Password reset failed", error.message);
        return;
      }
      success("Password updated", "Your password was changed successfully");
      router.push("/today");
    } catch {
      showError("Connection failed", "Check your internet and try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
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
            <span className="text-2xl font-bold text-gray-900">
              {siteConfig.name}
            </span>
          </div>
          <p className="text-sm text-gray-500">Create a new password</p>
        </div>

        <div className="space-y-6">
          {sessionFailed ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-4">
                Link is invalid or has expired. Please request a new reset link.
              </p>
              <Button variant="marketing" onClick={() => router.push("/login")}>
                Back to login
              </Button>
            </div>
          ) : !sessionReady ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Verifying link...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="marketing"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save new password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
