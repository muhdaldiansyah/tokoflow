// app/(private)/plans/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { createClient } from "../../../lib/database/supabase/client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, H1, H2, P, Lead } from "../../components/ui";
import {
  Check,
  CreditCard,
  Sparkles,
  ArrowRight,
  Info,
  Plus,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function PlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [processingPlan, setProcessingPlan] = useState(null);
  const [monthlyPlans, setMonthlyPlans] = useState([]);
  const [annualPlans, setAnnualPlans] = useState([]);
  const [addOnPlan, setAddOnPlan] = useState(null);
  const [paymentNotification, setPaymentNotification] = useState(null);

  // Check for payment status in URL
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const orderId = searchParams.get('order_id');
    
    if (paymentStatus) {
      setPaymentNotification({
        status: paymentStatus,
        orderId: orderId
      });
      
      // Clear the URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Auto-hide notification after 10 seconds
      setTimeout(() => {
        setPaymentNotification(null);
      }, 10000);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPlansAndUserData();
  }, [user, paymentNotification]);

  const fetchPlansAndUserData = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      
      const { data: plans, error: plansError } = await supabase
        .from('kn_membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_idr', { ascending: true });

      if (plansError) {
        console.error('Error fetching plans:', plansError);
      } else if (plans) {
        const monthly = [];
        const annual = [];
        let addon = null;

        plans.forEach(plan => {
          const features = typeof plan.features === 'string' 
            ? JSON.parse(plan.features) 
            : plan.features;

          const transformedPlan = {
            id: plan.plan_code,
            name: plan.name,
            description: plan.description,
            price: plan.price_idr,
            credits: plan.credits_amount,
            features: features || [],
            isPopular: plan.is_popular,
            validityDays: plan.validity_days,
            pricePerCredit: plan.price_per_credit
          };

          if (plan.plan_code.includes('ADDON') || plan.name === 'Super-Credit') {
            addon = transformedPlan;
          } else if (plan.plan_code.includes('ANNUAL') || plan.validity_days === 365) {
            annual.push(transformedPlan);
          } else {
            monthly.push(transformedPlan);
          }
        });

        setMonthlyPlans(monthly);
        setAnnualPlans(annual);
        setAddOnPlan(addon);
      }
      
      const { data: profile } = await supabase
        .from('av_profiles')
        .select('subscription_plan, subscription_status, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentPlan(profile.subscription_plan || 'FREE_TRIAL_30');
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: submissions } = await supabase
        .from('kn_submissions')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (submissions) {
        const currentPlanData = plans?.find(p => p.plan_code === (profile?.subscription_plan || 'FREE_TRIAL_30'));
        const limit = currentPlanData?.credits_amount || 30;
        
        setUsage({
          sheets: submissions.length,
          limit: limit,
          percentage: (submissions.length / limit) * 100
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleSelectPlan = async (planId) => {
    setProcessingPlan(planId);
    // Redirect to checkout page with selected plan
    router.push(`/checkout?plan=${planId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-24">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-100 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const plansToShow = billingPeriod === 'monthly' ? monthlyPlans : annualPlans;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-24">
        {/* Payment Notification */}
        {paymentNotification && (
          <div className={`mb-8 p-4 rounded-lg flex items-center justify-between ${
            paymentNotification.status === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : paymentNotification.status === 'pending'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {paymentNotification.status === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : paymentNotification.status === 'pending' ? (
                <Clock className="w-6 h-6 text-yellow-600 mr-3" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mr-3" />
              )}
              <div>
                <p className={`font-medium ${
                  paymentNotification.status === 'success' 
                    ? 'text-green-800' 
                    : paymentNotification.status === 'pending'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {paymentNotification.status === 'success' 
                    ? 'Pembayaran berhasil! Kredit Anda telah ditambahkan.' 
                    : paymentNotification.status === 'pending'
                    ? 'Pembayaran sedang diproses. Kredit akan ditambahkan setelah pembayaran dikonfirmasi.'
                    : 'Pembayaran gagal atau dibatalkan.'}
                </p>
                {paymentNotification.orderId && (
                  <p className="text-sm text-gray-600 mt-1">
                    Order ID: {paymentNotification.orderId}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setPaymentNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Pilih paket yang tepat untuk Anda
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mulai gratis, upgrade kapan saja. Semua paket termasuk fitur AI koreksi otomatis.
          </p>
        </div>

        {/* Current Usage */}
        {currentPlan && usage && (
          <div className="mb-12 max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Paket saat ini</p>
                  <p className="text-lg font-medium text-gray-900">
                    {monthlyPlans.find(p => p.id === currentPlan)?.name || 
                     annualPlans.find(p => p.id === currentPlan)?.name || 'Free Trial'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Kredit terpakai</p>
                  <p className="text-lg font-medium text-gray-900">
                    {usage.sheets} / {usage.limit}
                  </p>
                </div>
              </div>
              
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gray-900 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                />
              </div>
              
              {usage.percentage > 80 && (
                <p className="text-sm text-orange-600 mt-3 flex items-center">
                  <Info className="w-4 h-4 mr-1.5" />
                  Kredit hampir habis. Pertimbangkan untuk upgrade.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === "monthly" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === "yearly" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tahunan
              {billingPeriod === "yearly" && (
                <span className="ml-2 text-green-600">Hemat s/d 27%</span>
              )}
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plansToShow.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const isFree = plan.id.includes('FREE');
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border transition-all ${
                  plan.isPopular 
                    ? 'border-gray-900 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${isCurrentPlan ? 'bg-gray-50' : 'bg-white'}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Paling populer
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Name & Price */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-semibold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-600 ml-1">
                          /{billingPeriod === "monthly" ? 'bulan' : 'tahun'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {plan.credits} kredit
                      {plan.pricePerCredit > 0 && (
                        <span className="text-gray-500"> • Rp {plan.pricePerCredit}/kredit</span>
                      )}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-6">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <Check className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : plan.isPopular
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {processingPlan === plan.id ? (
                      'Memproses...'
                    ) : isCurrentPlan ? (
                      'Paket aktif'
                    ) : isFree ? (
                      'Mulai gratis'
                    ) : (
                      'Pilih paket'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Super-Credit Add-on */}
        {addOnPlan && (
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900">{addOnPlan.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{addOnPlan.description}</p>
                  <ul className="space-y-2">
                    {addOnPlan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-gray-400 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-center md:text-right">
                  <div className="text-2xl font-semibold text-gray-900 mb-1">
                    {formatPrice(addOnPlan.price)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {addOnPlan.credits} kredit • Berlaku {addOnPlan.validityDays} hari
                  </p>
                  <button
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    onClick={() => handleSelectPlan(addOnPlan.id)}
                    disabled={processingPlan === addOnPlan.id}
                  >
                    {processingPlan === addOnPlan.id ? 'Memproses...' : 'Beli add-on'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      

    
      </div>
    </div>
  );
}