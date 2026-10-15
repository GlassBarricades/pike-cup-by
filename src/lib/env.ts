import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),
})

export const env = envSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || undefined,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || undefined,
})

export const isSupabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
