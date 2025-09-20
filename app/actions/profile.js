'use server'

import { createClient } from '../../lib/database/supabase-server/index.js'

export async function createProfile(profile) {
  const supabase = await createClient()
  const { data: { user }, error: uErr } = await supabase.auth.getUser()
  if (uErr || !user) return { ok: false, error: 'Not authenticated' }

  const payload = {
    id: user.id,
    ...profile,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // upsert avoids PK conflicts if signUp already inserted a row
  const { data, error } = await supabase
    .from('av_profiles')
    .upsert([payload], { onConflict: 'id' })
    .select()
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}

export async function updateProfile(profile) {
  const supabase = await createClient()
  const { data: { user }, error: uErr } = await supabase.auth.getUser()
  if (uErr || !user) return { ok: false, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('av_profiles')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}