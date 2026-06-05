"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { USER_ROLES } from "@/lib/utils/constants";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role;
      if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.MODERATOR) {
        toast.error("Akses ditolak — hanya admin");
        router.replace("/today");
        return;
      }

      setAuthorized(true);
    }

    checkAdmin();
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
