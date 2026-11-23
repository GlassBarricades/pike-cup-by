import type { TournamentFormat } from '../tournament/formats/types'

export type FormatPreset = {
  id: string
  slug: string
  name: string
  description: string
  format: TournamentFormat
  is_system: boolean
  archived_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type FormatPresetInput = {
  slug: string
  name: string
  description?: string
  format: TournamentFormat
}
