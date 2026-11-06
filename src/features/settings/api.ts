import { supabase } from '../../lib/supabase'
import type { AppSettings } from './types'

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('id, hide_registration, updated_at')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data as AppSettings
}

export async function updateHideRegistration(hide: boolean): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .update({ hide_registration: hide, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('id, hide_registration, updated_at')
    .single()
  if (error) throw error
  return data as AppSettings
}
