import { supabase } from '../../lib/supabase'
import { FISHING_KEYS, type ScheduleWriteRow } from './scheduleEdit'
import {
  type Athlete,
  type CatchRow,
  type DrawSlip,
  type JudgeCandidate,
  type MiniTour,
  type ScheduleSegment,
  type Team,
  type TeamMembership,
  type TeamNameHistoryRow,
  type Tournament,
  type TournamentEntry,
  type TournamentRosterMember,
  type ZoneCode,
  type ZoneJudgeRow,
} from './types'

export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('event_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Tournament[]
}

export async function fetchTournamentById(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Tournament | null
}

/** Текущий: live → published (свежий) → любой последний по дате */
export async function fetchActiveTournament(): Promise<Tournament | null> {
  const list = await fetchTournaments()
  if (list.length === 0) return null
  const live = list.find((t) => t.status === 'live')
  if (live) return live
  const published = list.find((t) => t.status === 'published')
  if (published) return published
  return list[0] ?? null
}

const DEFAULT_RULES_STUB = `# Регламент

Добавьте текст регламента для этого турнира в кабинете организатора.
`

type ScheduleSeedRow = {
  key: string
  title: string
  sort_order: number
  startHour: number
  startMin: number
  endHour: number
  endMin: number
  /** Ловля: создаёт mini_tours. Переход мини-тур не создаёт. */
  tour?: 1 | 2
  mini?: number
  windowKind?: 'fishing' | 'move'
  moveTour?: 1 | 2
  moveMini?: number
}

const DEFAULT_DAY_SCHEDULE: ScheduleSeedRow[] = [
  { key: 'registration', title: 'Регистрация, жеребьёвка', sort_order: 10, startHour: 6, startMin: 0, endHour: 7, endMin: 30 },
  { key: 'briefing', title: 'Построение, выступление оргкомитета', sort_order: 20, startHour: 7, startMin: 40, endHour: 8, endMin: 10 },
  { key: 'to_zones', title: 'Расход по зонам', sort_order: 30, startHour: 8, startMin: 10, endHour: 8, endMin: 30, windowKind: 'move', moveTour: 1, moveMini: 1 },
  { key: 'to_first', title: 'Выход на первый сектор', sort_order: 35, startHour: 8, startMin: 30, endHour: 9, endMin: 0, windowKind: 'move', moveTour: 1, moveMini: 1 },
  { key: 'tour1_mt1', title: 'I тур · мини-тур 1', sort_order: 40, startHour: 9, startMin: 0, endHour: 9, endMin: 30, tour: 1, mini: 1, windowKind: 'fishing' },
  { key: 'move_t1_mt2', title: 'Переход на мини-тур 2', sort_order: 45, startHour: 9, startMin: 30, endHour: 9, endMin: 40, windowKind: 'move', moveTour: 1, moveMini: 2 },
  { key: 'tour1_mt2', title: 'I тур · мини-тур 2', sort_order: 50, startHour: 9, startMin: 40, endHour: 10, endMin: 10, tour: 1, mini: 2, windowKind: 'fishing' },
  { key: 'move_t1_mt3', title: 'Переход на мини-тур 3', sort_order: 55, startHour: 10, startMin: 10, endHour: 10, endMin: 20, windowKind: 'move', moveTour: 1, moveMini: 3 },
  { key: 'tour1_mt3', title: 'I тур · мини-тур 3', sort_order: 60, startHour: 10, startMin: 20, endHour: 10, endMin: 50, tour: 1, mini: 3, windowKind: 'fishing' },
  { key: 'move_t1_mt4', title: 'Переход на мини-тур 4', sort_order: 65, startHour: 10, startMin: 50, endHour: 11, endMin: 0, windowKind: 'move', moveTour: 1, moveMini: 4 },
  { key: 'tour1_mt4', title: 'I тур · мини-тур 4', sort_order: 70, startHour: 11, startMin: 0, endHour: 11, endMin: 30, tour: 1, mini: 4, windowKind: 'fishing' },
  { key: 'move_t1_mt5', title: 'Переход на мини-тур 5', sort_order: 75, startHour: 11, startMin: 30, endHour: 11, endMin: 40, windowKind: 'move', moveTour: 1, moveMini: 5 },
  { key: 'tour1_mt5', title: 'I тур · мини-тур 5', sort_order: 80, startHour: 11, startMin: 40, endHour: 12, endMin: 10, tour: 1, mini: 5, windowKind: 'fishing' },
  { key: 'break', title: 'Перерыв', sort_order: 90, startHour: 12, startMin: 10, endHour: 13, endMin: 30, windowKind: 'move', moveTour: 2, moveMini: 1 },
  { key: 'tour2_mt1', title: 'II тур · мини-тур 1', sort_order: 100, startHour: 13, startMin: 30, endHour: 14, endMin: 0, tour: 2, mini: 1, windowKind: 'fishing' },
  { key: 'move_t2_mt2', title: 'Переход на мини-тур 2', sort_order: 105, startHour: 14, startMin: 0, endHour: 14, endMin: 10, windowKind: 'move', moveTour: 2, moveMini: 2 },
  { key: 'tour2_mt2', title: 'II тур · мини-тур 2', sort_order: 110, startHour: 14, startMin: 10, endHour: 14, endMin: 40, tour: 2, mini: 2, windowKind: 'fishing' },
  { key: 'move_t2_mt3', title: 'Переход на мини-тур 3', sort_order: 115, startHour: 14, startMin: 40, endHour: 14, endMin: 50, windowKind: 'move', moveTour: 2, moveMini: 3 },
  { key: 'tour2_mt3', title: 'II тур · мини-тур 3', sort_order: 120, startHour: 14, startMin: 50, endHour: 15, endMin: 20, tour: 2, mini: 3, windowKind: 'fishing' },
  { key: 'move_t2_mt4', title: 'Переход на мини-тур 4', sort_order: 125, startHour: 15, startMin: 20, endHour: 15, endMin: 30, windowKind: 'move', moveTour: 2, moveMini: 4 },
  { key: 'tour2_mt4', title: 'II тур · мини-тур 4', sort_order: 130, startHour: 15, startMin: 30, endHour: 16, endMin: 0, tour: 2, mini: 4, windowKind: 'fishing' },
  { key: 'move_t2_mt5', title: 'Переход на мини-тур 5', sort_order: 135, startHour: 16, startMin: 0, endHour: 16, endMin: 10, windowKind: 'move', moveTour: 2, moveMini: 5 },
  { key: 'tour2_mt5', title: 'II тур · мини-тур 5', sort_order: 140, startHour: 16, startMin: 10, endHour: 16, endMin: 40, tour: 2, mini: 5, windowKind: 'fishing' },
  { key: 'scoring', title: 'Подсчёт результатов', sort_order: 150, startHour: 16, startMin: 40, endHour: 17, endMin: 20 },
  { key: 'awards', title: 'Награждение победителей', sort_order: 160, startHour: 17, startMin: 20, endHour: 18, endMin: 0 },
]

function minskIso(eventDate: string, hour: number, minute: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${eventDate}T${pad(hour)}:${pad(minute)}:00+03:00`
}

function minskClock(iso: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Minsk',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? '0')
  const hour = pick('hour')
  return { hour: hour === 24 ? 0 : hour, minute: pick('minute') }
}

export async function seedDefaultSchedule(tournamentId: string, eventDate: string): Promise<void> {
  const segmentRows = DEFAULT_DAY_SCHEDULE.map((row) => ({
    tournament_id: tournamentId,
    key: row.key,
    title: row.title,
    sort_order: row.sort_order,
    planned_starts_at: minskIso(eventDate, row.startHour, row.startMin),
    planned_ends_at: minskIso(eventDate, row.endHour, row.endMin),
    window_kind: row.windowKind ?? null,
    move_tour: row.moveTour ?? null,
    move_mini: row.moveMini ?? null,
  }))

  const { data: segments, error: segError } = await supabase
    .from('schedule_segments')
    .insert(segmentRows)
    .select('id, key')
  if (segError) throw segError

  const byKey = new Map((segments ?? []).map((s) => [s.key as string, s.id as string]))
  const miniRows = DEFAULT_DAY_SCHEDULE.filter((r) => r.tour && r.mini).map((r) => ({
    tournament_id: tournamentId,
    segment_id: byKey.get(r.key)!,
    tour_number: r.tour!,
    mini_number: r.mini!,
  }))

  const { error: miniError } = await supabase.from('mini_tours').insert(miniRows)
  if (miniError) throw miniError
}

export async function createTournament(input: {
  name: string
  eventDate: string
  location: string
  status: Tournament['status']
  organizers?: string[]
  rulesContent?: string
  withDefaultSchedule?: boolean
  zeroPlaceIsGroupSizePlusOne?: boolean
}): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: input.name.trim(),
      event_date: input.eventDate,
      location: input.location.trim(),
      status: input.status,
      organizers: input.organizers ?? [],
      rules_content: input.rulesContent?.trim() || DEFAULT_RULES_STUB,
      zero_place_is_group_size_plus_one: input.zeroPlaceIsGroupSizePlusOne ?? true,
    })
    .select('*')
    .single()
  if (error) throw error

  const tournament = data as Tournament
  if (input.withDefaultSchedule !== false) {
    await seedDefaultSchedule(tournament.id, input.eventDate)
  }
  return tournament
}

export async function fetchSegments(tournamentId: string): Promise<ScheduleSegment[]> {
  const { data, error } = await supabase
    .from('schedule_segments')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as ScheduleSegment[]
}

export async function fetchMiniTours(tournamentId: string): Promise<MiniTour[]> {
  const { data, error } = await supabase
    .from('mini_tours')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('tour_number')
    .order('mini_number')
  if (error) throw error
  return (data ?? []) as MiniTour[]
}

const ENTRY_SELECT =
  '*, team:teams(*), roster:tournament_roster_members(*), draw_slip:draw_slips(*, sectors:draw_slip_sectors(*))'

export async function fetchEntries(tournamentId: string): Promise<TournamentEntry[]> {
  const { data, error } = await supabase
    .from('tournament_entries')
    .select(ENTRY_SELECT)
    .eq('tournament_id', tournamentId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as TournamentEntry[]
}

export async function fetchCatches(tournamentId: string): Promise<CatchRow[]> {
  const { data: entries, error: entriesError } = await supabase
    .from('tournament_entries')
    .select('id')
    .eq('tournament_id', tournamentId)
  if (entriesError) throw entriesError
  const ids = (entries ?? []).map((e) => e.id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('catches')
    .select('*')
    .in('entry_id', ids)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CatchRow[]
}

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('name')
  if (error) throw error
  return (data ?? []) as Team[]
}

export async function fetchTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).maybeSingle()
  if (error) throw error
  return data as Team | null
}

export async function fetchAthleteById(athleteId: string): Promise<Athlete | null> {
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athleteId)
    .maybeSingle()
  if (error) throw error
  return data as Athlete | null
}

export type MembershipHistoryRow = {
  id: string
  team_id: string
  athlete_id: string
  started_at: string
  ended_at: string | null
  team?: Team | null
  athlete?: Athlete | null
}

export async function fetchAthleteMembershipHistory(
  athleteId: string,
): Promise<MembershipHistoryRow[]> {
  const { data, error } = await supabase
    .from('team_memberships')
    .select('*, team:teams(*)')
    .eq('athlete_id', athleteId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MembershipHistoryRow[]
}

export async function fetchTeamMembershipHistory(teamId: string): Promise<MembershipHistoryRow[]> {
  const { data, error } = await supabase
    .from('team_memberships')
    .select('*, athlete:athletes(*)')
    .eq('team_id', teamId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MembershipHistoryRow[]
}

export type TeamTournamentAppearance = {
  entry: TournamentEntry
  tournament: Tournament | null
}

export async function fetchTeamTournamentAppearances(
  teamId: string,
): Promise<TeamTournamentAppearance[]> {
  const { data, error } = await supabase
    .from('tournament_entries')
    .select(`${ENTRY_SELECT}, tournament:tournaments(*)`)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as Array<TournamentEntry & { tournament?: Tournament | null }>).map(
    (row) => ({
      entry: row,
      tournament: row.tournament ?? null,
    }),
  )
}

export async function fetchAthleteTournamentAppearances(athleteId: string): Promise<
  Array<{
    tournament: Tournament | null
    teamName: string
    fullNameSnapshot: string
    entryId: string
  }>
> {
  const { data, error } = await supabase
    .from('tournament_roster_members')
    .select(
      'full_name_snapshot, entry_id, entry:tournament_entries(id, team_name_snapshot, team:teams(name), tournament:tournaments(*))',
    )
    .eq('athlete_id', athleteId)
  if (error) throw error

  type Row = {
    full_name_snapshot: string
    entry_id: string
    entry: {
      id: string
      team_name_snapshot: string
      team: { name: string } | null
      tournament: Tournament | null
    } | null
  }

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const snap = row.entry?.team_name_snapshot?.trim()
    const live = row.entry?.team?.name?.trim()
    return {
      tournament: row.entry?.tournament ?? null,
      teamName: snap || live || 'Команда',
      fullNameSnapshot: row.full_name_snapshot,
      entryId: row.entry_id,
    }
  })
}

export async function fetchTeamNameHistory(teamId: string): Promise<TeamNameHistoryRow[]> {
  const { data, error } = await supabase
    .from('team_name_history')
    .select('*')
    .eq('team_id', teamId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TeamNameHistoryRow[]
}

export async function fetchAthletes(): Promise<Athlete[]> {
  const { data, error } = await supabase.from('athletes').select('*').order('full_name')
  if (error) throw error
  return (data ?? []) as Athlete[]
}

export type AthleteWithTeam = Athlete & {
  current_team_id: string | null
  current_team_name: string | null
}

export async function fetchAthletesWithTeams(): Promise<AthleteWithTeam[]> {
  const [{ data: athletes, error: aErr }, { data: memberships, error: mErr }] = await Promise.all([
    supabase.from('athletes').select('*').order('full_name'),
    supabase
      .from('team_memberships')
      .select('athlete_id, team_id, team:teams(id, name)')
      .is('ended_at', null),
  ])
  if (aErr) throw aErr
  if (mErr) throw mErr

  const byAthlete = new Map<string, { team_id: string; team_name: string }>()
  for (const m of memberships ?? []) {
    const team = m.team as unknown as { id: string; name: string } | null
    byAthlete.set(m.athlete_id as string, {
      team_id: m.team_id as string,
      team_name: team?.name ?? 'Команда',
    })
  }

  return ((athletes ?? []) as Athlete[]).map((a) => ({
    ...a,
    current_team_id: byAthlete.get(a.id)?.team_id ?? null,
    current_team_name: byAthlete.get(a.id)?.team_name ?? null,
  }))
}

export async function createAthlete(input: {
  fullName: string
  phone?: string
}): Promise<Athlete> {
  const { data, error } = await supabase
    .from('athletes')
    .insert({
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Athlete
}

export async function updateAthlete(
  athleteId: string,
  input: { fullName: string; phone?: string },
): Promise<void> {
  const { error } = await supabase
    .from('athletes')
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', athleteId)
  if (error) throw error
}

export async function deleteAthlete(athleteId: string): Promise<void> {
  const { error } = await supabase.from('athletes').delete().eq('id', athleteId)
  if (error) throw error
}

export async function createTeam(name: string): Promise<Team> {
  const trimmed = name.trim()
  const { data, error } = await supabase
    .from('teams')
    .insert({ name: trimmed })
    .select('*')
    .single()
  if (error) throw error

  const team = data as Team
  const { error: historyError } = await supabase.from('team_name_history').insert({
    team_id: team.id,
    name: trimmed,
  })
  if (historyError) throw historyError

  return team
}

export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', teamId)
  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'Нельзя удалить команду: она ещё связана с заявками турнира. Примените миграцию 005 или снимите заявки.',
      )
    }
    throw error
  }
}

export async function renameTeam(teamId: string, name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Название не может быть пустым')

  const { data: current, error: currentError } = await supabase
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .single()
  if (currentError) throw currentError
  if ((current as Team).name === trimmed) return

  const now = new Date().toISOString()

  const { error: closeError } = await supabase
    .from('team_name_history')
    .update({ ended_at: now })
    .eq('team_id', teamId)
    .is('ended_at', null)
  if (closeError) throw closeError

  const { error: insertError } = await supabase.from('team_name_history').insert({
    team_id: teamId,
    name: trimmed,
    started_at: now,
  })
  if (insertError) throw insertError

  const { error } = await supabase
    .from('teams')
    .update({ name: trimmed, updated_at: now })
    .eq('id', teamId)
  if (error) throw error
}

export async function fetchActiveMemberships(teamId: string): Promise<TeamMembership[]> {
  const { data, error } = await supabase
    .from('team_memberships')
    .select('*, athlete:athletes(*)')
    .eq('team_id', teamId)
    .is('ended_at', null)
  if (error) throw error
  return (data ?? []) as TeamMembership[]
}

/** Назначить ровно 2 уже существующих рыбака в команду (текущий состав). */
export async function setTeamMembers(teamId: string, athleteIds: [string, string]): Promise<void> {
  const [a, b] = athleteIds
  if (!a || !b || a === b) {
    throw new Error('Выберите двух разных рыбаков')
  }

  const now = new Date().toISOString()

  const { error: endTeamError } = await supabase
    .from('team_memberships')
    .update({ ended_at: now })
    .eq('team_id', teamId)
    .is('ended_at', null)
  if (endTeamError) throw endTeamError

  const { error: endAthletesError } = await supabase
    .from('team_memberships')
    .update({ ended_at: now })
    .in('athlete_id', [a, b])
    .is('ended_at', null)
  if (endAthletesError) throw endAthletesError

  const { error: insertError } = await supabase.from('team_memberships').insert([
    { team_id: teamId, athlete_id: a },
    { team_id: teamId, athlete_id: b },
  ])
  if (insertError) throw insertError
}

export async function clearTeamMembers(teamId: string): Promise<void> {
  const { error } = await supabase
    .from('team_memberships')
    .update({ ended_at: new Date().toISOString() })
    .eq('team_id', teamId)
    .is('ended_at', null)
  if (error) throw error
}

export async function createEntryFromTeam(input: {
  tournamentId: string
  teamId: string
  quota: TournamentEntry['quota']
  contactPhone?: string
  startZone?: ZoneCode | null
}): Promise<TournamentEntry> {
  const memberships = await fetchActiveMemberships(input.teamId)
  if (memberships.length !== 2) {
    throw new Error('У команды должно быть ровно 2 спортсмена в текущем составе')
  }

  const team = await fetchTeamById(input.teamId)
  if (!team) throw new Error('Команда не найдена')

  const { data: entry, error } = await supabase
    .from('tournament_entries')
    .insert({
      tournament_id: input.tournamentId,
      team_id: input.teamId,
      team_name_snapshot: team.name,
      quota: input.quota,
      contact_phone: input.contactPhone?.trim() || null,
      start_zone: input.startZone ?? null,
      status: 'confirmed',
    })
    .select('*')
    .single()
  if (error) throw error

  const roster = memberships.slice(0, 2).map((m, index) => ({
    entry_id: (entry as TournamentEntry).id,
    athlete_id: m.athlete_id,
    full_name_snapshot: m.athlete?.full_name ?? 'Без имени',
    slot: (index + 1) as 1 | 2,
  }))
  const { error: rosterError } = await supabase.from('tournament_roster_members').insert(roster)
  if (rosterError) throw rosterError

  return entry as TournamentEntry
}

export async function updateEntryZone(entryId: string, startZone: ZoneCode): Promise<void> {
  const { error } = await supabase
    .from('tournament_entries')
    .update({ start_zone: startZone })
    .eq('id', entryId)
  if (error) throw error
}

export async function updateEntryZones(entryIds: string[], startZone: ZoneCode): Promise<void> {
  if (entryIds.length === 0) return
  const { error } = await supabase
    .from('tournament_entries')
    .update({ start_zone: startZone })
    .in('id', entryIds)
  if (error) throw error
}

export async function fetchDrawSlips(): Promise<DrawSlip[]> {
  const { data, error } = await supabase
    .from('draw_slips')
    .select('*, sectors:draw_slip_sectors(*)')
    .order('sort_order')
    .order('code')
  if (error) throw error
  return (data ?? []) as DrawSlip[]
}

export async function setEntryDrawSlip(entryId: string, slipId: string | null): Promise<void> {
  if (!slipId) {
    const { error } = await supabase
      .from('tournament_entries')
      .update({ draw_slip_id: null, start_zone: null })
      .eq('id', entryId)
    if (error) throw error
    return
  }

  const { data: slip, error: slipError } = await supabase
    .from('draw_slips')
    .select('start_zone')
    .eq('id', slipId)
    .single()
  if (slipError) throw slipError

  const { error } = await supabase
    .from('tournament_entries')
    .update({ draw_slip_id: slipId, start_zone: slip.start_zone as ZoneCode })
    .eq('id', entryId)
  if (error) {
    if (error.code === '23505') {
      throw new Error('Эта бумажка уже прикреплена к другой команде')
    }
    throw error
  }
}

export async function lockAllRosters(tournamentId: string): Promise<void> {
  const { error } = await supabase
    .from('tournament_entries')
    .update({ roster_locked_at: new Date().toISOString() })
    .eq('tournament_id', tournamentId)
    .is('roster_locked_at', null)
  if (error) throw error
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('tournament_entries').delete().eq('id', entryId)
  if (error) throw error
}

export async function updateTournamentRules(
  tournamentId: string,
  rulesContent: string,
): Promise<void> {
  const { error } = await supabase
    .from('tournaments')
    .update({ rules_content: rulesContent, rules_updated_at: new Date().toISOString() })
    .eq('id', tournamentId)
  if (error) throw error
}

export async function lockTournamentRules(tournamentId: string): Promise<void> {
  const { error } = await supabase
    .from('tournaments')
    .update({ rules_locked_at: new Date().toISOString() })
    .eq('id', tournamentId)
  if (error) throw error
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId)
  if (error) throw error
}

/** Отладочный перезапуск: то же расписание на новую дату, без уловов, сдвига и паузы. */
export async function restartTournament(tournamentId: string, eventDate: string): Promise<void> {
  const segments = await fetchSegments(tournamentId)
  for (const segment of segments) {
    const start = minskClock(segment.planned_starts_at)
    const end = minskClock(segment.planned_ends_at)
    const { error } = await supabase
      .from('schedule_segments')
      .update({
        planned_starts_at: minskIso(eventDate, start.hour, start.minute),
        planned_ends_at: minskIso(eventDate, end.hour, end.minute),
      })
      .eq('id', segment.id)
    if (error) throw error
  }

  const { data: entries, error: entryError } = await supabase
    .from('tournament_entries')
    .select('id')
    .eq('tournament_id', tournamentId)
  if (entryError) throw entryError
  const entryIds = (entries ?? []).map((entry) => entry.id as string)
  if (entryIds.length > 0) {
    const { error: catchError } = await supabase.from('catches').delete().in('entry_id', entryIds)
    if (catchError) throw catchError
  }

  const { error } = await supabase
    .from('tournaments')
    .update({
      event_date: eventDate,
      status: 'live',
      schedule_delay_minutes: 0,
      schedule_paused_at: null,
      live_phase_override: null,
    })
    .eq('id', tournamentId)
  if (error) throw error
}

export async function updateTournamentMeta(
  tournamentId: string,
  patch: Partial<
    Pick<
      Tournament,
      | 'name'
      | 'location'
      | 'status'
      | 'organizers'
      | 'event_date'
      | 'zero_place_is_group_size_plus_one'
    >
  >,
): Promise<void> {
  const { error } = await supabase.from('tournaments').update(patch).eq('id', tournamentId)
  if (error) throw error
}

export async function updateScheduleOps(
  tournamentId: string,
  patch: Partial<
    Pick<Tournament, 'schedule_delay_minutes' | 'schedule_paused_at' | 'live_phase_override'>
  >,
): Promise<void> {
  const { error } = await supabase.from('tournaments').update(patch).eq('id', tournamentId)
  if (error) throw error
}

const FISHING_KEY_LIST = new Set<string>(FISHING_KEYS)

/** Переписывает границы дня. Мини-туры и уловы не трогает. Сдвиг, пауза и override сбрасываются. */
export async function saveScheduleDraft(tournamentId: string, rows: ScheduleWriteRow[]): Promise<void> {
  const keepIds = new Set(rows.flatMap((row) => (row.id ? [row.id] : [])))

  for (const row of rows) {
    if (!row.id) continue
    const { error } = await supabase
      .from('schedule_segments')
      .update({
        title: row.title,
        sort_order: row.sortOrder,
        planned_starts_at: row.startsAt,
        planned_ends_at: row.endsAt,
        window_kind: row.windowKind,
        move_tour: row.moveTour,
        move_mini: row.moveMini,
      })
      .eq('id', row.id)
    if (error) throw error
  }

  const { data: existing, error: listError } = await supabase
    .from('schedule_segments')
    .select('id, key')
    .eq('tournament_id', tournamentId)
  if (listError) throw listError
  const removeIds = (existing ?? [])
    .filter((row) => !keepIds.has(row.id as string) && !FISHING_KEY_LIST.has(row.key as string))
    .map((row) => row.id as string)
  if (removeIds.length > 0) {
    const { error } = await supabase.from('schedule_segments').delete().in('id', removeIds)
    if (error) throw error
  }

  const fresh = rows.filter((row) => !row.id)
  if (fresh.length > 0) {
    const { error } = await supabase.from('schedule_segments').insert(
      fresh.map((row) => ({
        tournament_id: tournamentId,
        key: row.key,
        title: row.title,
        sort_order: row.sortOrder,
        planned_starts_at: row.startsAt,
        planned_ends_at: row.endsAt,
        window_kind: row.windowKind,
        move_tour: row.moveTour,
        move_mini: row.moveMini,
      })),
    )
    if (error) throw error
  }

  const { error } = await supabase
    .from('tournaments')
    .update({
      schedule_delay_minutes: 0,
      schedule_paused_at: null,
      live_phase_override: null,
    })
    .eq('id', tournamentId)
  if (error) throw error
}

export async function addCatch(input: {
  entryId: string
  miniTourId: string
  weightGrams: number
  userId: string
}): Promise<CatchRow> {
  const { data, error } = await supabase
    .from('catches')
    .insert({
      entry_id: input.entryId,
      mini_tour_id: input.miniTourId,
      weight_grams: input.weightGrams,
      created_by: input.userId,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as CatchRow
}

export async function deleteCatch(catchId: string): Promise<void> {
  const { error } = await supabase.from('catches').delete().eq('id', catchId)
  if (error) throw error
}

export async function updateCatchWeight(catchId: string, weightGrams: number): Promise<void> {
  const { error } = await supabase
    .from('catches')
    .update({ weight_grams: weightGrams })
    .eq('id', catchId)
  if (error) throw error
}

export async function fetchJudgeCandidates(): Promise<JudgeCandidate[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'judge')
    .order('full_name')
  if (error) throw error
  return (data ?? []) as JudgeCandidate[]
}

export async function fetchZoneJudges(tournamentId: string): Promise<ZoneJudgeRow[]> {
  const { data, error } = await supabase
    .from('tournament_zone_judges')
    .select('*, profile:profiles(id, full_name, role)')
    .eq('tournament_id', tournamentId)
    .order('zone')
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as ZoneJudgeRow & { profile?: ZoneJudgeRow['profile'] | ZoneJudgeRow['profile'][] }
    const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile
    return { ...r, profile }
  })
}

export async function setZoneJudge(input: {
  tournamentId: string
  userId: string
  zone: ZoneCode
}): Promise<ZoneJudgeRow> {
  const { data, error } = await supabase
    .from('tournament_zone_judges')
    .upsert(
      {
        tournament_id: input.tournamentId,
        user_id: input.userId,
        zone: input.zone,
      },
      { onConflict: 'tournament_id,user_id' },
    )
    .select('*, profile:profiles(id, full_name, role)')
    .single()
  if (error) throw error
  const r = data as ZoneJudgeRow & { profile?: ZoneJudgeRow['profile'] | ZoneJudgeRow['profile'][] }
  const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile
  return { ...r, profile }
}

export async function removeZoneJudge(id: string): Promise<void> {
  const { error } = await supabase.from('tournament_zone_judges').delete().eq('id', id)
  if (error) throw error
}

export async function fetchProfilesByIds(
  ids: string[],
): Promise<Map<string, { id: string; full_name: string | null }>> {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = new Map<string, { id: string; full_name: string | null }>()
  if (unique.length === 0) return map

  const { data, error } = await supabase.from('profiles').select('id, full_name').in('id', unique)
  if (error) throw error
  for (const p of data ?? []) {
    map.set(p.id, { id: p.id, full_name: p.full_name })
  }
  return map
}

export type { TournamentRosterMember }
