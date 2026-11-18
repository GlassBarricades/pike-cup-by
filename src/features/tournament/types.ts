import type { TournamentFormat } from './formats/types'
import type { TournamentMapMode, VenueMap } from './venueMap'

export type { TournamentMapMode }

export type ZoneCode = 'A' | 'B'
export type TeamQuota = 'open' | 'prize' | 'org'
export type EntryStatus = 'registered' | 'confirmed' | 'withdrawn' | 'dq'
export type TournamentStatus = 'draft' | 'published' | 'live' | 'finished'
export type LeagueKind = 'national' | 'regional' | 'other'
export type RosterRole = 'athlete' | 'captain' | 'representative'

export type League = {
  id: string
  slug: string
  name: string
  short_name: string
  kind: LeagueKind
  region_code: string | null
  description: string
  brand_color: string | null
  is_active: boolean
  default_format: TournamentFormat | null
  created_at: string
  updated_at: string
}

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
  /** null = фестиваль / событие вне лиги */
  league_id: string | null
  format: TournamentFormat
  /** Пусто на карточке турнира; полный текст грузится отдельно на экране регламента. */
  rules_content: string
  rules_updated_at: string
  rules_locked_at: string | null
  schedule_delay_minutes: number
  schedule_paused_at: string | null
  live_phase_override: string | null
  /** @deprecated используйте format.ranking.zeroPlace; оставлено для совместимости с БД */
  zero_place_is_group_size_plus_one: boolean
  /** Leaflet: точка сбора и полигоны зон; null если не задано */
  venue_map: VenueMap | null
  /** Какую карту показывать зрителям и судьям */
  map_mode: TournamentMapMode
}

export type TournamentListFilter = {
  /** Этапы конкретной лиги */
  leagueId?: string
  /** Только фестивали (league_id is null) */
  festivalsOnly?: boolean
}

/** Активный турнир: live → published → любой. scope сужает выборку. */
export type ActiveTournamentScope =
  | { kind: 'any' }
  | { kind: 'league'; leagueId: string }
  | { kind: 'festivals' }

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
  /** Куда идёт переход. Только у window_kind = move */
  move_tour?: number | null
  /** Куда идёт переход. Только у window_kind = move */
  move_mini?: number | null
}

export type MiniTour = {
  id: string
  tournament_id: string
  segment_id: string
  tour_number: number
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
  is_junior: boolean
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
  tour_number: number
  mini_number: number
  sector_number: number
}

export type DrawSlip = {
  id: string
  tournament_id: string
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
export function entryTeamName(entry: Pick<TournamentEntry, 'team_name_snapshot' | 'team' | 'team_id'>): string {
  return entry.team_name_snapshot || entry.team?.name || 'Команда'
}

/** Заявка без команды — только личный зачёт. */
export function isSoloEntry(entry: Pick<TournamentEntry, 'team_id'>): boolean {
  return entry.team_id == null
}

/** Колонка «команда»: у личников — «личный». */
export function entryTeamColumn(
  entry: Pick<TournamentEntry, 'team_id' | 'team_name_snapshot' | 'team'>,
): string {
  if (isSoloEntry(entry)) return 'личный'
  return entryTeamName(entry)
}

/** Заголовок заявки в списках штаба. */
export function entryListTitle(
  entry: Pick<TournamentEntry, 'team_id' | 'team_name_snapshot' | 'team'>,
): string {
  if (isSoloEntry(entry)) {
    const name = entry.team_name_snapshot?.trim() || 'Участник'
    return `${name} · личный`
  }
  return entryTeamName(entry)
}

export type TournamentRosterMember = {
  id: string
  entry_id: string
  athlete_id: string | null
  full_name_snapshot: string
  slot: number
  role: RosterRole
  is_junior: boolean
  draw_slip_id?: string | null
  draw_slip?: DrawSlip | null
}

export type CatchRow = {
  id: string
  tournament_id: string
  entry_id: string
  /** Для individual — спортсмен; для pikecup обычно null */
  roster_member_id: string | null
  mini_tour_id: string
  weight_grams: number
  created_by: string | null
  created_at: string
}

export type CatchRevisionAction = 'insert' | 'update' | 'delete'

export type CatchRevision = {
  id: string
  catch_id: string | null
  entry_id: string
  roster_member_id: string | null
  mini_tour_id: string
  weight_grams: number
  action: CatchRevisionAction
  actor_id: string | null
  created_at: string
}

export type AthleteDraw = {
  id: string
  tournament_id: string
  roster_member_id: string
  tour_number: number
  mini_number: number
  zone: string
  sector: number
  created_at: string
}

export type ZoneJudgeRow = {
  id: string
  tournament_id: string
  user_id: string
  zone: ZoneCode
  weighing_completed_at?: string | null
  created_at: string
  profile?: { id: string; full_name: string | null; role: string }
}

export type JudgeCandidate = {
  id: string
  full_name: string | null
  role: string
}
