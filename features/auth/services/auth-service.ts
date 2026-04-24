import { createClient } from "@/lib/supabase/client";
import type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
} from "../schemas/auth.schema";

const supabase = createClient();

export async function signInWithEmail(data: LoginFormData) {
  const { email, password } = data;
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(data: RegisterFormData) {
  const { email, password, fullName } = data;

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  return { data: authData, error };
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(data: ForgotPasswordFormData) {
  const { email } = data;
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

