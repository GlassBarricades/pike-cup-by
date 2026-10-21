import { slipSector } from './slips'
import type { ScheduleSegment, Tournament, TournamentEntry, ZoneCode } from './types'
import { entryTeamName } from './types'

export function getEffectiveNow(tournament: Pick<Tournament, 'schedule_delay_minutes' | 'schedule_paused_at'>, now = new Date()): Date {
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
    kind: 'before' | 'active' | 'gap' | 'after'
    segment: ScheduleSegment | null
    effectiveNow: Date
    endsAtEffective: Date | null
    nextSegment: ScheduleSegment | null
}

export function getCurrentPhase(
    tournament: Pick<Tournament, 'schedule_delay_minutes' | 'schedule_paused_at' | 'live_phase_override'>,
    segments: ScheduleSegment[],
    now = new Date()
): CurrentPhase {
    const ordered = [...segments].sort((a, b) => a.sort_order - b.sort_order)
    const effectiveNow = getEffectiveNow(tournament, now)

    if (tournament.live_phase_override) {
        const override = ordered.find((s) => s.key === tournament.live_phase_override) ?? null
        return {
            kind: override ? 'active' : 'before',
            segment: override,
            effectiveNow,
            endsAtEffective: override ? shiftTime(override.planned_ends_at, tournament.schedule_delay_minutes) : null,
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
        if (effectiveNow < start) {
            return {
                kind: 'gap',
                segment: ordered[i - 1] ?? null,
                effectiveNow,
                endsAtEffective: shiftTime(seg.planned_starts_at, tournament.schedule_delay_minutes),
                nextSegment: seg,
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
export function physicalZone(startZone: 'A' | 'B' | null | undefined, tourNumber: 1 | 2): 'A' | 'B' | null {
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

export type FishingSlot = { tour: 1 | 2; mini: number }

export type MapWindow =
    | { state: 'off'; label: string }
    | { state: 'fishing'; tour: 1 | 2; mini: number; label: string }
    | {
          state: 'moving'
          tour: 1 | 2
          mini: number
          from: FishingSlot | null
          progress: number
          label: string
      }

export type TeamMarker = {
    entryId: string
    teamName: string
    slipCode: string
    state: 'fishing' | 'moving'
    zone: ZoneCode
    sector: number
    fromZone: ZoneCode | null
    fromSector: number | null
    progress: number
}

type SegmentMeaning = { kind: 'fishing' | 'move' | 'other'; slot: FishingSlot | null }

function asSlot(tour: number | null | undefined, mini: number | null | undefined): FishingSlot | null {
    if ((tour === 1 || tour === 2) && typeof mini === 'number' && mini >= 1 && mini <= 5) {
        return { tour, mini }
    }
    return null
}

function slotFromKey(key: string): FishingSlot | null {
    const match = /^tour([12])_mt([1-5])$/.exec(key)
    if (!match) return null
    return { tour: Number(match[1]) as 1 | 2, mini: Number(match[2]) }
}

/** Новые окна читаются из полей. У архива то же правило выводится из ключа. */
export function interpretSegment(segment: ScheduleSegment): SegmentMeaning {
    if (segment.window_kind === 'fishing') {
        return { kind: 'fishing', slot: slotFromKey(segment.key) }
    }
    if (segment.window_kind === 'move') {
        return { kind: 'move', slot: asSlot(segment.move_tour, segment.move_mini) }
    }
    const fishing = slotFromKey(segment.key)
    if (fishing) return { kind: 'fishing', slot: fishing }
    if (segment.key === 'to_zones') return { kind: 'move', slot: { tour: 1, mini: 1 } }
    if (segment.key === 'break') return { kind: 'move', slot: { tour: 2, mini: 1 } }
    return { kind: 'other', slot: null }
}

function orderedSegments(segments: ScheduleSegment[]): ScheduleSegment[] {
    return [...segments].sort((a, b) => a.sort_order - b.sort_order)
}

function previousFishing(ordered: ScheduleSegment[], beforeIndex: number): FishingSlot | null {
    for (let i = beforeIndex - 1; i >= 0; i--) {
        const info = interpretSegment(ordered[i])
        if (info.kind === 'fishing' && info.slot) return info.slot
    }
    return null
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.min(1, Math.max(0, value))
}

/** Пробег по берегу на карте, а не всё окно перехода. */
const MAP_MOVE_MS = 60_000

function moveProgress(now: Date, start: Date, end: Date): number {
    const travelEnd = Math.min(end.getTime(), start.getTime() + MAP_MOVE_MS)
    const span = travelEnd - start.getTime()
    if (span <= 0) return 1
    return clamp01((now.getTime() - start.getTime()) / span)
}

function romanTour(tour: 1 | 2): string {
    return tour === 1 ? 'I' : 'II'
}

function windowLabel(state: 'fishing' | 'moving', slot: FishingSlot, from: FishingSlot | null): string {
    if (state === 'fishing') return `${romanTour(slot.tour)} тур · мини-тур ${slot.mini}`
    if (from && from.tour !== slot.tour) return `Переход · ${romanTour(slot.tour)} тур · мини-тур ${slot.mini}`
    return `Переход на мини-тур ${slot.mini}`
}

function tourFromSegment(segment: ScheduleSegment | null): 1 | 2 | null {
    if (!segment) return null
    return interpretSegment(segment).slot?.tour ?? tourNumberFromSegmentKey(segment.key)
}

/** Тур, который сейчас виден на зонах: ловля, переход или ближайшее следующее окно. */
export function tourNumberFromPhase(phase: CurrentPhase | null): 1 | 2 | null {
    if (!phase) return null
    if (phase.kind === 'gap') return tourFromSegment(phase.nextSegment) ?? tourFromSegment(phase.segment)
    return tourFromSegment(phase.segment)
}

export function resolveMapWindow(
    tournament: Pick<Tournament, 'schedule_delay_minutes' | 'schedule_paused_at' | 'live_phase_override'>,
    segments: ScheduleSegment[],
    now = new Date()
): MapWindow {
    const phase = getCurrentPhase(tournament, segments, now)
    const ordered = orderedSegments(segments)

    if (phase.kind === 'before') return { state: 'off', label: 'До выхода на воду' }
    if (phase.kind === 'after') return { state: 'off', label: 'Ловля завершена' }

    if (phase.kind === 'active' && phase.segment) {
        const info = interpretSegment(phase.segment)
        if (info.kind === 'fishing' && info.slot) {
            return { state: 'fishing', ...info.slot, label: windowLabel('fishing', info.slot, null) }
        }
        if (info.kind === 'move' && info.slot) {
            const index = ordered.findIndex((segment) => segment.key === phase.segment?.key)
            const from = previousFishing(ordered, index)
            return {
                state: 'moving',
                tour: info.slot.tour,
                mini: info.slot.mini,
                from,
                progress: moveProgress(phase.effectiveNow, new Date(phase.segment.planned_starts_at), new Date(phase.segment.planned_ends_at)),
                label: windowLabel('moving', info.slot, from),
            }
        }
        return { state: 'off', label: phase.segment.title }
    }

    if (phase.kind === 'gap' && phase.nextSegment) {
        const next = phase.nextSegment
        const info = interpretSegment(next)
        const index = ordered.findIndex((segment) => segment.key === next.key)
        const previous = index > 0 ? ordered[index - 1] : null
        if ((info.kind === 'fishing' || info.kind === 'move') && info.slot) {
            const from = previousFishing(ordered, index)
            const gapStart = previous ? new Date(previous.planned_ends_at) : new Date(next.planned_starts_at)
            return {
                state: 'moving',
                tour: info.slot.tour,
                mini: info.slot.mini,
                from,
                progress: moveProgress(phase.effectiveNow, gapStart, new Date(next.planned_starts_at)),
                label: windowLabel('moving', info.slot, from),
            }
        }
        return { state: 'off', label: next.title }
    }

    return { state: 'off', label: 'До выхода на воду' }
}

export function fishingSlotsInOrder(segments: ScheduleSegment[]): FishingSlot[] {
    const slots: FishingSlot[] = []
    for (const segment of orderedSegments(segments)) {
        const info = interpretSegment(segment)
        if (info.kind === 'fishing' && info.slot) slots.push(info.slot)
    }
    return slots
}

export function slotTitle(slot: FishingSlot): string {
    return `${romanTour(slot.tour)} тур · мини-тур ${slot.mini}`
}

/** Мини-тур, в который садится улов по часам. Во время перехода — прошлый. */
export function clockWeighSlot(window: MapWindow, segments: ScheduleSegment[], phaseKind: CurrentPhase['kind'] | null): FishingSlot | null {
    if (window.state === 'fishing') return { tour: window.tour, mini: window.mini }
    if (window.state === 'moving') return window.from
    if (phaseKind === 'after') {
        const slots = fishingSlotsInOrder(segments)
        return slots[slots.length - 1] ?? null
    }
    return null
}

export function previousFishingSlot(slot: FishingSlot, segments: ScheduleSegment[]): FishingSlot | null {
    const slots = fishingSlotsInOrder(segments)
    const index = slots.findIndex((item) => item.tour === slot.tour && item.mini === slot.mini)
    if (index <= 0) return null
    return slots[index - 1] ?? null
}

export function lastFishingSlotOfTour(segments: ScheduleSegment[], tour: 1 | 2): FishingSlot | null {
    const slots = fishingSlotsInOrder(segments).filter((item) => item.tour === tour)
    return slots[slots.length - 1] ?? null
}

/** Слот записи с учётом выбранного на пульте тура и одного шага назад. */
export function resolveWeighTarget(input: {
    window: MapWindow
    segments: ScheduleSegment[]
    phaseKind: CurrentPhase['kind'] | null
    selectedTour: 1 | 2
    stepBack: boolean
}): { slot: FishingSlot | null; note: string | null } {
    const clock = clockWeighSlot(input.window, input.segments, input.phaseKind)
    if (!clock) return { slot: null, note: null }

    let slot = clock
    let note: string | null = null
    if (clock.tour !== input.selectedTour) {
        const forced = lastFishingSlotOfTour(input.segments, input.selectedTour)
        note = 'последний мини-тур выбранного тура'
        if (!forced) return { slot: null, note }
        slot = forced
    }

    if (input.stepBack) {
        const previous = previousFishingSlot(slot, input.segments)
        if (!previous) return { slot, note }
        slot = previous
        note = null
    }

    return { slot, note }
}

export function teamMarkers(entries: TournamentEntry[], window: MapWindow): TeamMarker[] {
    if (window.state === 'off') return []
    const destination = { tour: window.tour, mini: window.mini }
    const fromSlot = window.state === 'moving' ? window.from : null

    const markers: TeamMarker[] = []
    for (const entry of entries) {
        const slip = entry.draw_slip
        const startZone = entry.start_zone ?? slip?.start_zone ?? null
        if (!slip || !startZone) continue
        const sector = slipSector(slip, destination.tour, destination.mini)
        const zone = physicalZone(startZone, destination.tour)
        if (sector == null || !zone) continue

        if (window.state === 'fishing') {
            markers.push({
                entryId: entry.id,
                teamName: entryTeamName(entry),
                slipCode: slip.code,
                state: 'fishing',
                zone,
                sector,
                fromZone: null,
                fromSector: null,
                progress: 1,
            })
            continue
        }

        const fromZone = fromSlot ? physicalZone(startZone, fromSlot.tour) : null
        const fromSector = fromSlot ? slipSector(slip, fromSlot.tour, fromSlot.mini) : null
        markers.push({
            entryId: entry.id,
            teamName: entryTeamName(entry),
            slipCode: slip.code,
            state: 'moving',
            zone,
            sector,
            fromZone: fromZone && fromSector != null ? fromZone : null,
            fromSector: fromZone && fromSector != null ? fromSector : null,
            progress: window.progress,
        })
    }
    return markers
}
