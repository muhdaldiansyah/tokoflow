// app/(private)/koreksi/profile/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { createClient } from "../../../../lib/database/supabase/client";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  Save,
  Edit2,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Award,
  TrendingUp,
  Activity,
  BarChart3,
  Loader2,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  CreditCard,
  Receipt,
  Download,
  X,
  ArrowLeft
} from "lucide-react";

export default function ProfilePage() {
  const { user, profile: authProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Profile data
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    institution_name: "",
    address: "",
    city: "",
    country: "Indonesia",
    bio: "",
    avatar_url: "",
  });

  // Keep a copy of original data for cancel functionality
  const [originalProfile, setOriginalProfile] = useState({});

  // Statistics
  const [stats, setStats] = useState({
    totalExams: 0,
    totalGraded: 0,
    timeSaved: 0,
    accuracy: 0,
    thisMonth: 0,
    lastMonth: 0,
    growth: 0,
  });

  // Subscription info
  const [subscription, setSubscription] = useState({
    plan: "free",
    status: "active",
    endDate: null,
    creditsUsed: 0,
    creditsTotal: 50,
    creditsBalance: 0,
  });

  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    fetchProfileData();
    fetchStatistics();
    fetchSubscription();
    fetchTransactions();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('av_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const profileData = {
          full_name: data.full_name || "",
          email: user.email || "",
          phone_number: data.phone_number || "",
          institution_name: data.institution_name || "",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "Indonesia",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setErrorMessage("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      
      // Fetch exam statistics
      const { data: exams } = await supabase
        .from('kn_exams')
        .select('id, created_at')
        .eq('owner_id', user.id);

      const { data: submissions } = await supabase
        .from('kn_student_submissions')
        .select('id, created_at')
        .in('exam_id', exams?.map(e => e.id) || []);

      if (exams && submissions) {
        const totalExams = exams.length;
        const totalGraded = submissions.length;
        const timeSaved = totalGraded * 2.5; // Assuming 2.5 minutes saved per grading
        
        // Calculate monthly stats
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisMonthCount = submissions.filter(s => 
          new Date(s.created_at) >= thisMonthStart
        ).length;

        const lastMonthCount = submissions.filter(s => 
          new Date(s.created_at) >= lastMonthStart && 
          new Date(s.created_at) <= lastMonthEnd
        ).length;

        const growth = lastMonthCount > 0 
          ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1)
          : 0;

        setStats({
          totalExams,
          totalGraded,
          timeSaved: Math.round(timeSaved),
          accuracy: 95, // Mock accuracy for now
          thisMonth: thisMonthCount,
          lastMonth: lastMonthCount,
          growth: parseFloat(growth),
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      
      // Fetch user's profile with credits balance
      const { data: profileData } = await supabase
        .from('av_profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single();

      // Fetch active subscription
      const { data: subscriptionData } = await supabase
        .from('kn_user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
        
      const activeSubscription = subscriptionData?.[0] || null;

      if (activeSubscription) {
        // Get plan details from membership plans
        const { data: planData } = await supabase
          .from('kn_membership_plans')
          .select('*')
          .eq('plan_code', activeSubscription.plan_code)
          .single();

        setSubscription({
          plan: planData?.name || activeSubscription.plan_code || "free",
          status: activeSubscription.status,
          endDate: activeSubscription.end_date,
          creditsUsed: activeSubscription.credits_used || 0,
          creditsTotal: activeSubscription.credits_allocated || 50,
          creditsBalance: profileData?.credits_balance || 0,
        });
      } else {
        // No active subscription, set default free plan
        setSubscription({
          plan: "Free",
          status: "active",
          endDate: null,
          creditsUsed: stats.thisMonth,
          creditsTotal: 50,
          creditsBalance: profileData?.credits_balance || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      // Set default values if error
      setSubscription({
        plan: "Free",
        status: "active",
        endDate: null,
        creditsUsed: stats.thisMonth,
        creditsTotal: 50,
        creditsBalance: 0,
      });
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kn_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch plan details for each transaction
      if (data && data.length > 0) {
        const planCodes = [...new Set(data.map(t => t.plan_code))];
        const { data: plans } = await supabase
          .from('kn_membership_plans')
          .select('plan_code, name, credits_amount')
          .in('plan_code', planCodes);
        
        const planMap = {};
        plans?.forEach(plan => {
          planMap[plan.plan_code] = plan;
        });
        
        const mappedTransactions = data.map(transaction => ({
          ...transaction,
          plan_name: planMap[transaction.plan_code]?.name || transaction.plan_code,
          credits_amount: planMap[transaction.plan_code]?.credits_amount || 0,
        }));
        
        setTransactions(mappedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('av_profiles')
        .update({
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          institution_name: profile.institution_name,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          bio: profile.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMessage("Profile updated successfully!");
      setEditMode(false);
      setOriginalProfile(profile);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditMode(false);
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      settlement: { color: "bg-green-100 text-green-800", text: "Success" },
      capture: { color: "bg-green-100 text-green-800", text: "Success" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      expire: { color: "bg-red-100 text-red-800", text: "Expired" },
      cancel: { color: "bg-gray-100 text-gray-800", text: "Cancelled" },
      deny: { color: "bg-red-100 text-red-800", text: "Denied" },
      failure: { color: "bg-red-100 text-red-800", text: "Failed" },
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", text: status };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="bg-white border-b border-gray-200 h-20"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl h-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="h-96 bg-white rounded-2xl"></div>
                <div className="h-64 bg-white rounded-2xl"></div>
              </div>
              <div className="space-y-8">
                <div className="h-48 bg-white rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your personal information</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Basic Info */}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {profile.full_name || "User"}
                </h1>
                <p className="text-gray-600">{profile.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    {subscription.plan} Plan
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Member since {user?.created_at ? new Date(user.created_at).getFullYear() : "2024"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Success!</p>
              <p className="text-sm text-green-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update your personal details and institution information
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Full Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-900 py-2.5">{profile.full_name || "-"}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Phone Number
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={profile.phone_number}
                        onChange={(e) => handleInputChange("phone_number", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+62 812 3456 7890"
                      />
                    ) : (
                      <p className="text-gray-900 py-2.5">{profile.phone_number || "-"}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Institution
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={profile.institution_name}
                        onChange={(e) => handleInputChange("institution_name", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Your school or institution"
                      />
                    ) : (
                      <p className="text-gray-900 py-2.5">{profile.institution_name || "-"}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      City
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Your city"
                      />
                    ) : (
                      <p className="text-gray-900 py-2.5">{profile.city || "-"}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Country
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={profile.country}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Indonesia"
                      />
                    ) : (
                      <p className="text-gray-900 py-2.5">{profile.country || "-"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Usage Statistics</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your grading activity and performance metrics
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-gray-900">{stats.totalExams}</div>
                    <p className="text-sm text-gray-600 mt-1">Total Exams</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-green-600">{stats.totalGraded}</div>
                    <p className="text-sm text-gray-600 mt-1">Papers Graded</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-blue-600">{stats.timeSaved}h</div>
                    <p className="text-sm text-gray-600 mt-1">Time Saved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-purple-600">{stats.accuracy}%</div>
                    <p className="text-sm text-gray-600 mt-1">Accuracy</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-4">Monthly Activity</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-medium">{stats.thisMonth} submissions</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Month</span>
                      <span className="font-medium">{stats.lastMonth} submissions</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Growth</span>
                      <span className={`font-medium flex items-center ${
                        stats.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {stats.growth >= 0 ? '+' : ''}{stats.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your payment and subscription history
                </p>
              </div>
              <div className="p-6">
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Date</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Plan</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Amount</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Credits</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2 text-sm text-gray-600">
                              {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-2 text-sm font-medium text-gray-900">
                              {transaction.plan_name}
                            </td>
                            <td className="py-3 px-2 text-sm text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 px-2 text-sm text-gray-600">
                              {transaction.credits_amount || 0} credits
                            </td>
                            <td className="py-3 px-2">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="py-3 px-2">
                              {transaction.status === 'settlement' && transaction.metadata?.invoice_url && (
                                <a
                                  href={transaction.metadata.invoice_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Invoice
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-8">
            {/* Subscription Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Plan</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    {subscription.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {subscription.status}
                  </span>
                </div>
                {subscription.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valid Until</span>
                    <span className="text-sm font-medium">
                      {new Date(subscription.endDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Credits Balance</span>
                    <span className="text-sm font-medium">
                      {subscription.creditsBalance}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Credits Used</span>
                    <span className="text-sm font-medium">
                      {subscription.creditsUsed} / {subscription.creditsTotal}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (subscription.creditsUsed / subscription.creditsTotal) > 0.8 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((subscription.creditsUsed / subscription.creditsTotal) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <button
                  className="w-full mt-4 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  onClick={() => router.push('/plans')}
                >
                  <CreditCard className="w-4 h-4" />
                  Upgrade Plan
                </button>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
              </div>
              <div className="p-6">
                <button
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  onClick={() => router.push('/koreksi/settings')}
                >
                  <Shield className="w-4 h-4" />
                  Security Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}