'use client'

import { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react'
import { createClient } from '../../lib/database/supabase/client'
import { createProfile as createProfileAction, updateProfile as updateProfileAction } from '../actions/profile'

const Ctx = createContext(undefined)

export function AuthProvider({ children }) {
  const supabase = useMemo(() => createClient(), [])
  const mounted = useRef(true)

  const [state, setState] = useState({
    loading: true,
    user: null,
    session: null,
    profile: null,
  })

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('av_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) return null
      return data
    } catch {
      return null
    }
  }

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        if (!mounted.current) return
        setState({ loading: false, user: null, session: null, profile: null })
        return
      }
      const session = data?.session ?? null
      const user = session?.user ?? null
      const profile = user ? await fetchProfile(user.id) : null
      if (!mounted.current) return
      setState({ loading: false, user, session, profile })
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const user = session?.user ?? null
      const profile = user ? await fetchProfile(user.id) : null
      if (!mounted.current) return
      setState({ loading: false, user, session, profile })
    })

    return () => {
      mounted.current = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [supabase])

  const signOut = () => {
    // clean server-side (cookies) and bounce to /login
    window.location.href = '/logout'
  }

  const createProfile = async (profileData) => {
    const res = await createProfileAction(profileData)
    if (res.ok) setState(s => ({ ...s, profile: res.data }))
    return res
  }

  const updateProfile = async (profileData) => {
    const res = await updateProfileAction(profileData)
    if (res.ok) setState(s => ({ ...s, profile: res.data }))
    return res
  }

  const value = {
    user: state.user,
    session: state.session,
    profile: state.profile,
    loading: state.loading,
    signOut,
    createProfile,
    updateProfile,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}