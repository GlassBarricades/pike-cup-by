import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { AppRole, Profile } from './types'

type AuthContextValue = {
    session: Session | null
    user: User | null
    profile: Profile | null
    role: AppRole | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signUp: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function loadProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle()
    if (error) {
        console.error(error)
        return null
    }
    return data as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshProfile = useCallback(async () => {
        const userId = (await supabase.auth.getSession()).data.session?.user.id
        if (!userId) {
            setProfile(null)
            return
        }
        setProfile(await loadProfile(userId))
    }, [])

    useEffect(() => {
        let mounted = true

        supabase.auth.getSession().then(async ({ data }) => {
            if (!mounted) return
            setSession(data.session)
            if (data.session?.user) {
                setProfile(await loadProfile(data.session.user.id))
            }
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession)
            if (nextSession?.user) {
                void loadProfile(nextSession.user.id).then((p) => {
                    if (mounted) setProfile(p)
                })
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
    }, [])

    const signUp = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password })
        return { error: error?.message ?? null }
    }, [])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        setProfile(null)
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            session,
            user: session?.user ?? null,
            profile,
            role: profile?.role ?? null,
            loading,
            signIn,
            signUp,
            signOut,
            refreshProfile,
        }),
        [session, profile, loading, signIn, signUp, signOut, refreshProfile]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return ctx
}
