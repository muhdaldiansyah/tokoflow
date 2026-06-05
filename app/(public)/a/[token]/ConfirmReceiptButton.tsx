"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { confirmReceipt } from "./actions";

interface Props {
  token: string;
}

export function ConfirmReceiptButton({ token }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await confirmReceipt(token);
      if (result.ok || result.error === "already") {
        router.refresh();
        return;
      }
      if (result.error === "not_found" || result.error === "invalid") {
        setError("This link is no longer valid. Please contact the seller.");
        return;
      }
      setError("Couldn't confirm right now. Try again in a moment?");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover transition-colors disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        Confirm receipt
      </button>
      {error && (
        <p className="text-xs text-warm-rose text-center -mt-1">{error}</p>
      )}
    </>
  );
}
