"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { createClient } from "../../../lib/database/supabase/client";
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const planId = searchParams.get("plan");

  // Load Midtrans Snap script
  useEffect(() => {
    const script = document.createElement('script');
    // Use sandbox URL for testing
    const isSandbox = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.startsWith('SB-');
    script.src = isSandbox 
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    script.async = true;
    
    script.onload = () => {
      console.log('Midtrans Snap loaded successfully');
    };
    
    script.onerror = () => {
      console.error('Failed to load Midtrans Snap');
      setError('Failed to load payment system. Please refresh the page.');
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!user && !authLoading) {
      // Redirect to login if not authenticated
      router.push("/login?redirect=/checkout?plan=" + planId);
      return;
    }
    
    if (!planId) {
      router.push("/plans");
      return;
    }
    
    if (user) {
      fetchPlanDetails();
    }
  }, [planId, user, authLoading]);

  const fetchPlanDetails = async () => {
    try {
      const supabase = createClient();
      
      const { data: planData, error } = await supabase
        .from('kn_membership_plans')
        .select('*')
        .eq('plan_code', planId)
        .single();

      if (error || !planData) {
        setError("Paket tidak ditemukan");
        return;
      }

      const features = typeof planData.features === 'string' 
        ? JSON.parse(planData.features) 
        : planData.features;

      setPlan({
        id: planData.plan_code,
        name: planData.name,
        description: planData.description,
        price: planData.price_idr,
        credits: planData.credits_amount,
        features: features || [],
        validityDays: planData.validity_days
      });
    } catch (error) {
      console.error('Error fetching plan:', error);
      setError("Terjadi kesalahan saat memuat data paket");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInRupiah) => {
    if (priceInRupiah === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceInRupiah);
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Call API to create transaction with Midtrans
      const response = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          amount: plan.price,
          planName: plan.name,
          userEmail: user.email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API response error:', data);
        throw new Error(data.error || 'Failed to create transaction');
      }

      // Redirect to Midtrans payment page or show QR code
      if (data.token) {
        // Check if snap is loaded
        if (typeof window.snap === 'undefined') {
          setError('Payment system not loaded. Please refresh the page.');
          setProcessing(false);
          return;
        }
        
        // Use Midtrans Snap popup
        window.snap.pay(data.token, {
          onSuccess: function(result) {
            console.log('Payment success:', result);
            
            // Also manually update transaction status for immediate credit update
            fetch('/api/payment/manual-update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                order_id: result.order_id,
                transaction_status: 'success'
              })
            })
            .then(() => {
              router.push('/plans?payment=success&order_id=' + result.order_id);
            })
            .catch(err => {
              console.error('Failed to update status:', err);
              router.push('/plans?payment=success');
            });
          },
          onPending: function(result) {
            console.log('Payment pending:', result);
            router.push('/plans?payment=pending');
          },
          onError: function(result) {
            console.log('Payment error:', result);
            setError('Pembayaran gagal. Silakan coba lagi.');
            setProcessing(false);
          },
          onClose: function() {
            console.log('Payment popup closed');
            setProcessing(false);
          }
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Terjadi kesalahan saat memproses pembayaran');
      setProcessing(false);
    }
  };

  // Show loading while auth is being checked
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">{error}</p>
          <Link href="/plans" className="text-blue-600 hover:text-blue-700 text-sm">
            Kembali ke halaman paket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link 
          href="/plans"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke pilih paket
        </Link>

        {/* Checkout Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-1">Konfirmasi pembelian paket Anda</p>
          </div>

          {/* Plan Details */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Detail Paket</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{plan?.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{plan?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(plan?.price)}</p>
                    <p className="text-sm text-gray-600">
                      {plan?.validityDays === 365 ? '/tahun' : '/bulan'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Kredit</span>
                    <span className="font-medium text-gray-900">{plan?.credits} lembar</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Masa berlaku</span>
                    <span className="font-medium text-gray-900">{plan?.validityDays} hari</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Yang Anda dapatkan</h2>
              <ul className="space-y-3">
                {plan?.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePayment}
                disabled={processing}
                className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Bayar Sekarang
                  </>
                )}
              </button>
              
              <Link
                href="/plans"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Kembali
              </Link>
            </div>

            {/* Payment Info */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Pembayaran diproses melalui Midtrans. Aman dan terpercaya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
