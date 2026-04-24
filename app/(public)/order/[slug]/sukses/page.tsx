import { Check } from "lucide-react";
import { getPublicBusinessInfo } from "@/lib/services/public-order.service";
import { SuccessActions } from "./SuccessActions";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ name?: string; order?: string; phone?: string; oid?: string; total?: string; ta?: string; preorder?: string; langganan?: string }>;
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { name, order, phone, oid, total, ta, preorder, langganan } = await searchParams;

  const business = await getPublicBusinessInfo(slug);
  const qrisUrl = business?.qrisUrl;
  const businessPhone = phone || business?.businessPhone;
  const totalAmount = total ? parseInt(total, 10) : 0;
  const transferAmount = ta ? parseInt(ta, 10) : totalAmount;
  const isPreorder = preorder === "1";
  const isLangganan = langganan === "1";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Success header */}
      <div className="text-center mb-4">
        <div className="w-14 h-14 rounded-full bg-warm-green-light flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-warm-green" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Order received!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLangganan
            ? "Your order is recorded. Payment as agreed."
            : isPreorder
              ? "Your order is recorded. Confirm via WhatsApp for next steps."
              : `${name || "The seller"} will confirm via WhatsApp shortly.`
          }
        </p>
      </div>

      <SuccessActions
        qrisUrl={qrisUrl}
        businessPhone={businessPhone}
        orderNumber={order || ""}
        orderId={oid}
        businessName={name || ""}
        slug={slug}
        totalFromUrl={totalAmount}
        transferAmountFromUrl={transferAmount}
        isPreorder={isPreorder}
        isLangganan={isLangganan}
      />

      {/* Subtle branding */}
      <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
        Made with <a href="https://tokoflow.com" className="underline hover:text-muted-foreground">Tokoflow</a>
      </p>
    </div>
  );
}
