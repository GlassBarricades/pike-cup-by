import { fishingKeys as keysFromFormat, PIKECUP_FORMAT, type TournamentFormat } from './formats'
import type { ScheduleSegment } from './types'

/** @deprecated PikeCup keys; предпочитайте fishingKeys(format) */
export const FISHING_KEYS = keysFromFormat(PIKECUP_FORMAT)

export type DraftKind = 'fishing' | 'move' | 'stage'

export type ScheduleDraftRow = {
  id: string | null
  key: string
  title: string
  kind: DraftKind
  minutes: number
  lockedFishing: boolean
}

export type ScheduleDraft = {
  anchor: Date
  rows: ScheduleDraftRow[]
}

export type ScheduleWriteRow = {
  id: string | null
  key: string
  title: string
  sortOrder: number
  startsAt: string
  endsAt: string
  windowKind: 'fishing' | 'move' | null
  moveTour: number | null
  moveMini: number | null
}

export function fishingScheduleReady(
  segments: ScheduleSegment[],
  format: TournamentFormat = PIKECUP_FORMAT,
): boolean {
  const keys = keysFromFormat(format)
  const byKey = new Map(segments.map((segment) => [segment.key, segment]))
  return keys.every((key) => byKey.get(key)?.window_kind === 'fishing')
}

export function toMinskInput(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Minsk',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00'
  const hour = pick('hour') === '24' ? '00' : pick('hour')
  return `${pick('year')}-${pick('month')}-${pick('day')}T${hour}:${pick('minute')}`
}

export function fromMinskInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+03:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function fishingSlot(key: string): { tour: number; mini: number } | null {
  const match = /^tour(\d+)_mt(\d+)$/.exec(key)
  if (!match) return null
  return { tour: Number(match[1]), mini: Number(match[2]) }
}

function minutesBetween(startIso: string, endIso: string): number {
  const minutes = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000)
  return Math.max(1, minutes)
}

function rowFromSegment(segment: ScheduleSegment, format: TournamentFormat = PIKECUP_FORMAT): ScheduleDraftRow {
  const locked = new Set(keysFromFormat(format))
  const lockedFishing = locked.has(segment.key) || Boolean(fishingSlot(segment.key) && segment.window_kind === 'fishing')
  const kind: DraftKind = lockedFishing ? 'fishing' : segment.window_kind === 'move' ? 'move' : 'stage'
  return {
    id: segment.id,
    key: segment.key,
    title: segment.title,
    kind,
    minutes: minutesBetween(segment.planned_starts_at, segment.planned_ends_at),
    lockedFishing,
  }
}

export function draftFromSegments(
  segments: ScheduleSegment[],
  format: TournamentFormat = PIKECUP_FORMAT,
): ScheduleDraft {
  const ordered = [...segments].sort((a, b) => a.sort_order - b.sort_order)
  if (ordered.length === 0) {
    return { anchor: new Date(), rows: [] }
  }
  const rows: ScheduleDraftRow[] = []
  for (let index = 0; index < ordered.length; index++) {
    const segment = ordered[index]
    rows.push(rowFromSegment(segment, format))
    const next = ordered[index + 1]
    if (!next) continue
    const gap = Math.round(
      (new Date(next.planned_starts_at).getTime() - new Date(segment.planned_ends_at).getTime()) / 60_000,
    )
    if (gap >= 1) {
      rows.push({
        id: null,
        key: `stage_${crypto.randomUUID()}`,
        title: 'Пауза',
        kind: 'stage',
        minutes: gap,
        lockedFishing: false,
      })
    }
  }
  return { anchor: new Date(ordered[0].planned_starts_at), rows }
}

export function rowBounds(draft: ScheduleDraft): { startsAt: Date; endsAt: Date }[] {
  let cursor = draft.anchor.getTime()
  return draft.rows.map((row) => {
    const startsAt = new Date(cursor)
    cursor += Math.max(1, row.minutes) * 60_000
    return { startsAt, endsAt: new Date(cursor) }
  })
}

export function setAnchor(draft: ScheduleDraft, anchor: Date): ScheduleDraft {
  return { ...draft, anchor }
}

export function setRowTitle(draft: ScheduleDraft, index: number, title: string): ScheduleDraft {
  return {
    ...draft,
    rows: draft.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, title } : row)),
  }
}

export function setRowMinutes(draft: ScheduleDraft, index: number, minutes: number): ScheduleDraft {
  const next = Math.max(1, Math.round(minutes))
  return {
    ...draft,
    rows: draft.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, minutes: next } : row)),
  }
}

export function removeRow(draft: ScheduleDraft, index: number): ScheduleDraft {
  const row = draft.rows[index]
  if (!row || row.lockedFishing) return draft
  return { ...draft, rows: draft.rows.filter((_, rowIndex) => rowIndex !== index) }
}

export function insertStage(draft: ScheduleDraft, afterIndex: number): ScheduleDraft {
  const row: ScheduleDraftRow = {
    id: null,
    key: `stage_${crypto.randomUUID()}`,
    title: 'Этап',
    kind: 'stage',
    minutes: 10,
    lockedFishing: false,
  }
  const rows = [...draft.rows]
  rows.splice(Math.max(0, afterIndex + 1), 0, row)
  return { ...draft, rows }
}

function nextFishing(rows: ScheduleDraftRow[], index: number): { tour: number; mini: number } | null {
  for (let cursor = index + 1; cursor < rows.length; cursor++) {
    if (rows[cursor].kind !== 'fishing') continue
    return fishingSlot(rows[cursor].key)
  }
  return null
}

export function toWriteRows(draft: ScheduleDraft): ScheduleWriteRow[] {
  const bounds = rowBounds(draft)
  return draft.rows.map((row, index) => {
    const slot = row.kind === 'move' ? nextFishing(draft.rows, index) : null
    const title = row.title.trim() || (row.kind === 'fishing' ? row.title : 'Этап')
    return {
      id: row.id,
      key: row.key,
      title,
      sortOrder: (index + 1) * 10,
      startsAt: bounds[index].startsAt.toISOString(),
      endsAt: bounds[index].endsAt.toISOString(),
      windowKind: row.kind === 'fishing' ? 'fishing' : slot ? 'move' : null,
      moveTour: slot?.tour ?? null,
      moveMini: slot?.mini ?? null,
    }
  })
}
