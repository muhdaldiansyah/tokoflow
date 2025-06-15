// lib/subscription/planLimits.js
import { createClient } from '../../lib/database/supabase/client';

/**
 * Get the user's current subscription plan and its limits
 * @param {string} userId - The user's ID
 * @returns {Promise<{plan: Object|null, maxDocumentUpload: number}>}
 */
export async function getUserPlanLimits(userId) {
  const supabase = createClient();
  
  try {
    if (!userId) {
      return { plan: null, maxDocumentUpload: 1 }; // Default for anonymous users
    }

    // Get user's profile to find their active subscription
    const { data: profile, error: profileError } = await supabase
      .from('av_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { plan: null, maxDocumentUpload: 1 };
    }

    // Get the user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('kn_user_subscriptions')
      .select('plan_code')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      // No active subscription, check for free plan
      const { data: freePlan, error: freePlanError } = await supabase
        .from('kn_membership_plans')
        .select('*')
        .eq('plan_code', 'FREE_TRIAL_30')
        .single();

      if (freePlanError || !freePlan) {
        return { plan: null, maxDocumentUpload: 1 };
      }

      return { 
        plan: freePlan, 
        maxDocumentUpload: freePlan.max_document_upload || 1 
      };
    }

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('kn_membership_plans')
      .select('*')
      .eq('plan_code', subscription.plan_code)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return { plan: null, maxDocumentUpload: 1 };
    }

    return { 
      plan: plan, 
      maxDocumentUpload: plan.max_document_upload || 1 
    };
  } catch (error) {
    console.error('Error in getUserPlanLimits:', error);
    return { plan: null, maxDocumentUpload: 1 };
  }
}

/**
 * Validate if the user can upload more files based on their plan
 * @param {string} userId - The user's ID
 * @param {number} currentFileCount - Current number of files
 * @param {number} newFileCount - Number of new files to upload
 * @returns {Promise<{allowed: boolean, maxAllowed: number, message: string}>}
 */
export async function validateFileUploadLimit(userId, currentFileCount, newFileCount) {
  const { maxDocumentUpload } = await getUserPlanLimits(userId);
  const totalFiles = currentFileCount + newFileCount;
  
  if (totalFiles > maxDocumentUpload) {
    return {
      allowed: false,
      maxAllowed: maxDocumentUpload,
      message: `Paket Anda hanya mengizinkan maksimal ${maxDocumentUpload} file. Anda sudah memiliki ${currentFileCount} file.`
    };
  }
  
  return {
    allowed: true,
    maxAllowed: maxDocumentUpload,
    message: ''
  };
}
