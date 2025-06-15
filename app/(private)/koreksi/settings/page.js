"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { createClient } from "../../../../lib/database/supabase/client";
import {
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation states
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);

  useEffect(() => {
    if (newPassword) {
      validatePasswordStrength(newPassword);
    } else {
      setPasswordStrength(0);
      setPasswordErrors([]);
    }
  }, [newPassword]);

  const validatePasswordStrength = (password) => {
    const errors = [];
    let strength = 0;
    
    // Check length
    if (password.length >= 8) {
      strength += 25;
    } else {
      errors.push("At least 8 characters");
    }
    
    // Check for uppercase
    if (/[A-Z]/.test(password)) {
      strength += 25;
    } else {
      errors.push("One uppercase letter");
    }
    
    // Check for lowercase
    if (/[a-z]/.test(password)) {
      strength += 25;
    } else {
      errors.push("One lowercase letter");
    }
    
    // Check for numbers
    if (/[0-9]/.test(password)) {
      strength += 25;
    } else {
      errors.push("One number");
    }
    
    setPasswordStrength(strength);
    setPasswordErrors(errors);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      return;
    }
    
    if (passwordStrength < 100) {
      setErrorMessage("Please choose a stronger password");
      return;
    }
    
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      const supabase = createClient();
      
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setSuccessMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error changing password:", error);
      setErrorMessage(error.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500";
    if (passwordStrength <= 50) return "bg-orange-500";
    if (passwordStrength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return "Weak";
    if (passwordStrength <= 50) return "Fair";
    if (passwordStrength <= 75) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Security Settings</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your account security</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Password Change Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl">
                <Key className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Password strength</span>
                      <span className={`text-sm font-medium ${
                        passwordStrength >= 75 ? 'text-green-600' : 
                        passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    {passwordErrors.length > 0 && (
                      <ul className="text-xs text-gray-500 space-y-1">
                        {passwordErrors.map((error, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 animate-fade-in">
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword || passwordStrength < 100}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Security Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900">Security Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use a unique password that you don't use on other websites</li>
                <li>• Consider using a password manager to generate and store secure passwords</li>
                <li>• Enable two-factor authentication for additional security (coming soon)</li>
                <li>• Regularly update your password to maintain account security</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}