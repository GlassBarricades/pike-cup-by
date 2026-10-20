import type { ScheduleSegment } from './types'

export const FISHING_KEYS = [
  'tour1_mt1',
  'tour1_mt2',
  'tour1_mt3',
  'tour1_mt4',
  'tour1_mt5',
  'tour2_mt1',
  'tour2_mt2',
  'tour2_mt3',
  'tour2_mt4',
  'tour2_mt5',
] as const

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
  moveTour: 1 | 2 | null
  moveMini: number | null
}

const FISHING_KEY_SET = new Set<string>(FISHING_KEYS)

export function fishingScheduleReady(segments: ScheduleSegment[]): boolean {
  const byKey = new Map(segments.map((segment) => [segment.key, segment]))
  return FISHING_KEYS.every((key) => byKey.get(key)?.window_kind === 'fishing')
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

function fishingSlot(key: string): { tour: 1 | 2; mini: number } | null {
  const match = /^tour([12])_mt([1-5])$/.exec(key)
  if (!match) return null
  return { tour: Number(match[1]) as 1 | 2, mini: Number(match[2]) }
}

function minutesBetween(startIso: string, endIso: string): number {
  const minutes = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000)
  return Math.max(1, minutes)
}

function rowFromSegment(segment: ScheduleSegment): ScheduleDraftRow {
  const lockedFishing = FISHING_KEY_SET.has(segment.key)
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

export function draftFromSegments(segments: ScheduleSegment[]): ScheduleDraft {
  const ordered = [...segments].sort((a, b) => a.sort_order - b.sort_order)
  if (ordered.length === 0) {
    return { anchor: new Date(), rows: [] }
  }
  const rows: ScheduleDraftRow[] = []
  for (let index = 0; index < ordered.length; index++) {
    const segment = ordered[index]
    rows.push(rowFromSegment(segment))
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

function nextFishing(rows: ScheduleDraftRow[], index: number): { tour: 1 | 2; mini: number } | null {
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
