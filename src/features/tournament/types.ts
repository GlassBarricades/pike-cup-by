export type ZoneCode = 'A' | 'B'
export type TeamQuota = 'open' | 'prize' | 'org'
export type EntryStatus = 'registered' | 'confirmed' | 'withdrawn' | 'dq'
export type TournamentStatus = 'draft' | 'published' | 'live' | 'finished'

export type Tournament = {
  id: string
  name: string
  event_date: string
  location: string
  organizers: string[]
  max_teams: number
  open_slots: number
  prize_slots: number
  org_slots: number
  status: TournamentStatus
  rules_content: string
  rules_updated_at: string
  rules_locked_at: string | null
  schedule_delay_minutes: number
  schedule_paused_at: string | null
  live_phase_override: string | null
  /** При весе 0: true → место n+1, false → место n (размер группы). */
  zero_place_is_group_size_plus_one: boolean
}

export type ScheduleWindowKind = 'fishing' | 'move'

export type ScheduleSegment = {
  id: string
  tournament_id: string
  key: string
  title: string
  sort_order: number
  planned_starts_at: string
  planned_ends_at: string
  /** null у строк архивных турниров, созданных до окон перехода */
  window_kind?: ScheduleWindowKind | null
  /** Куда идёт переход: тур 1–2. Только у window_kind = move */
  move_tour?: 1 | 2 | null
  /** Куда идёт переход: мини-тур 1–5. Только у window_kind = move */
  move_mini?: number | null
}

export type MiniTour = {
  id: string
  tournament_id: string
  segment_id: string
  tour_number: 1 | 2
  mini_number: number
}

export type Team = {
  id: string
  name: string
}

export type Athlete = {
  id: string
  full_name: string
  phone: string | null
}

export type TeamMembership = {
  id: string
  team_id: string
  athlete_id: string
  started_at: string
  ended_at: string | null
  athlete?: Athlete
}

export type TournamentEntry = {
  id: string
  tournament_id: string
  /** null, если команду удалили из справочника (протокол сохраняет team_name_snapshot) */
  team_id: string | null
  team_name_snapshot: string
  quota: TeamQuota
  status: EntryStatus
  contact_phone: string | null
  start_zone: ZoneCode | null
  draw_slip_id: string | null
  roster_locked_at: string | null
  team?: Team
  roster?: TournamentRosterMember[]
  draw_slip?: DrawSlip | null
}

export type DrawSlipSector = {
  id: string
  slip_id: string
  tour_number: 1 | 2
  mini_number: number
  sector_number: number
}

export type DrawSlip = {
  id: string
  code: string
  start_zone: ZoneCode
  sort_order: number
  sectors?: DrawSlipSector[]
}

export type TeamNameHistoryRow = {
  id: string
  team_id: string
  name: string
  started_at: string
  ended_at: string | null
}

/** Название команды в протоколе турнира (снимок заявки). */
export function entryTeamName(entry: Pick<TournamentEntry, 'team_name_snapshot' | 'team'>): string {
  return entry.team_name_snapshot || entry.team?.name || 'Команда'
}

export type TournamentRosterMember = {
  id: string
  entry_id: string
  athlete_id: string | null
  full_name_snapshot: string
  slot: 1 | 2
}

export type CatchRow = {
  id: string
  entry_id: string
  mini_tour_id: string
  weight_grams: number
  created_by: string | null
  created_at: string
}

export type ZoneJudgeRow = {
  id: string
  tournament_id: string
  user_id: string
  zone: ZoneCode
  created_at: string
  profile?: { id: string; full_name: string | null; role: string }
}

export type JudgeCandidate = {
  id: string
  full_name: string | null
  role: string
}
