import type { ScheduleSegment, Tournament } from './types'

export function getEffectiveNow(
  tournament: Pick<Tournament, 'schedule_delay_minutes' | 'schedule_paused_at'>,
  now = new Date(),
): Date {
  if (tournament.schedule_paused_at) {
    const pausedAt = new Date(tournament.schedule_paused_at)
    return new Date(pausedAt.getTime() - tournament.schedule_delay_minutes * 60_000)
  }
  return new Date(now.getTime() - tournament.schedule_delay_minutes * 60_000)
}

export function shiftTime(iso: string, delayMinutes: number): Date {
  return new Date(new Date(iso).getTime() + delayMinutes * 60_000)
}

export type CurrentPhase = {
  kind: 'before' | 'active' | 'after'
  segment: ScheduleSegment | null
  effectiveNow: Date
  endsAtEffective: Date | null
  nextSegment: ScheduleSegment | null
}

export function getCurrentPhase(
  tournament: Pick<Tournament, 'schedule_delay_minutes' | 'schedule_paused_at' | 'live_phase_override'>,
  segments: ScheduleSegment[],
  now = new Date(),
): CurrentPhase {
  const ordered = [...segments].sort((a, b) => a.sort_order - b.sort_order)
  const effectiveNow = getEffectiveNow(tournament, now)

  if (tournament.live_phase_override) {
    const override = ordered.find((s) => s.key === tournament.live_phase_override) ?? null
    return {
      kind: override ? 'active' : 'before',
      segment: override,
      effectiveNow,
      endsAtEffective: override
        ? shiftTime(override.planned_ends_at, tournament.schedule_delay_minutes)
        : null,
      nextSegment: null,
    }
  }

  if (ordered.length === 0) {
    return { kind: 'before', segment: null, effectiveNow, endsAtEffective: null, nextSegment: null }
  }

  const firstStart = new Date(ordered[0].planned_starts_at)
  if (effectiveNow < firstStart) {
    return {
      kind: 'before',
      segment: null,
      effectiveNow,
      endsAtEffective: null,
      nextSegment: ordered[0],
    }
  }

  for (let i = 0; i < ordered.length; i++) {
    const seg = ordered[i]
    const start = new Date(seg.planned_starts_at)
    const end = new Date(seg.planned_ends_at)
    if (effectiveNow >= start && effectiveNow < end) {
      return {
        kind: 'active',
        segment: seg,
        effectiveNow,
        endsAtEffective: shiftTime(seg.planned_ends_at, tournament.schedule_delay_minutes),
        nextSegment: ordered[i + 1] ?? null,
      }
    }
  }

  return {
    kind: 'after',
    segment: ordered[ordered.length - 1] ?? null,
    effectiveNow,
    endsAtEffective: null,
    nextSegment: null,
  }
}

export function formatTime(iso: string, delayMinutes = 0): string {
  return shiftTime(iso, delayMinutes).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Minsk',
  })
}

export function oppositeZone(zone: 'A' | 'B' | null | undefined): 'A' | 'B' | null {
  if (zone === 'A') return 'B'
  if (zone === 'B') return 'A'
  return null
}

/** Физическая зона команды в данном туре: I = стартовая, II = противоположная. */
export function physicalZone(
  startZone: 'A' | 'B' | null | undefined,
  tourNumber: 1 | 2,
): 'A' | 'B' | null {
  if (!startZone) return null
  return tourNumber === 1 ? startZone : oppositeZone(startZone)
}

/** Текущий тур по ключу сегмента расписания (`tour1_*` / `tour2_*`). */
export function tourNumberFromSegmentKey(key: string | null | undefined): 1 | 2 | null {
  if (!key) return null
  if (key.startsWith('tour1')) return 1
  if (key.startsWith('tour2')) return 2
  return null
}
