import { supabase } from '../../lib/supabase'
import type { AppRole, Profile } from './types'

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function updateProfileRole(userId: string, role: AppRole): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id, full_name, role')
    .single()
  if (error) throw error
  return data as Profile
}
