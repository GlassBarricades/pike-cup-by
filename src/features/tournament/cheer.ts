import { useEffect, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cheerCounts, cheerMine, cheerSet } from './api'

const CHEER_KEY = 'pikecup.cheer'
const SPECTATOR_KEY = 'pikecup.spectatorId'

export const cheerCountsKey = (tournamentId: string) => ['tournament', tournamentId, 'cheerCounts'] as const

export type CheerSelection = {
  entryIds: string[]
  primaryId: string | null
}

type CheerFile = CheerSelection & { tournamentId: string }

const EMPTY_FILE: CheerFile = { tournamentId: '', entryIds: [], primaryId: null }
const EMPTY_SELECTION: CheerSelection = { entryIds: [], primaryId: null }

let raw = '\u0000'
let cache: CheerFile = EMPTY_FILE
const listeners = new Set<() => void>()

function readStorage(): string {
  try {
    return localStorage.getItem(CHEER_KEY) ?? ''
  } catch {
    return ''
  }
}

function parse(text: string): CheerFile {
  if (!text) return EMPTY_FILE
  try {
    const parsed = JSON.parse(text) as {
      tournamentId?: unknown
      entryId?: unknown
      entryIds?: unknown
      primaryId?: unknown
    }
    const tournamentId = typeof parsed.tournamentId === 'string' ? parsed.tournamentId : ''
    const listed = Array.isArray(parsed.entryIds) ? parsed.entryIds.filter((id): id is string => typeof id === 'string') : []
    const legacy = typeof parsed.entryId === 'string' ? [parsed.entryId] : []
    const entryIds = [...new Set(listed.length > 0 ? listed : legacy)]
    const preferred = typeof parsed.primaryId === 'string' ? parsed.primaryId : (legacy[0] ?? null)
    const primaryId = preferred && entryIds.includes(preferred) ? preferred : (entryIds[0] ?? null)
    return { tournamentId, entryIds, primaryId }
  } catch {
    return EMPTY_FILE
  }
}

function readFile(): CheerFile {
  const text = readStorage()
  if (text === raw) return cache
  raw = text
  cache = parse(text)
  return cache
}

function commit(next: CheerFile) {
  const text = next.entryIds.length === 0 ? '' : JSON.stringify(next)
  try {
    if (text) localStorage.setItem(CHEER_KEY, text)
    else localStorage.removeItem(CHEER_KEY)
  } catch {
    /* private mode */
  }
  raw = text
  cache = text ? next : EMPTY_FILE
  listeners.forEach((listener) => listener())
}

function selectionFor(tournamentId: string): CheerFile {
  const file = readFile()
  if (file.tournamentId !== tournamentId) return { tournamentId, entryIds: [], primaryId: null }
  return file
}

/** Стабильный анонимный id устройства для серверных «болею». */
export function getSpectatorKey(): string {
  try {
    const existing = localStorage.getItem(SPECTATOR_KEY)
    if (existing && existing.length >= 8 && existing.length <= 80) return existing
    const next = crypto.randomUUID()
    localStorage.setItem(SPECTATOR_KEY, next)
    return next
  } catch {
    return `anon-${Date.now().toString(36)}`
  }
}

export function readCheer(tournamentId: string): string | null {
  const file = readFile()
  return file.tournamentId === tournamentId ? file.primaryId : null
}

type CheerChangeDetail = { tournamentId: string; entryId?: string; delta?: number; refetch?: boolean }

function emitCheerChange(detail: CheerChangeDetail) {
  window.dispatchEvent(new CustomEvent('pikecup:cheer-changed', { detail }))
}

export function toggleCheer(tournamentId: string, entryId: string) {
  const current = selectionFor(tournamentId)
  const turningOn = !current.entryIds.includes(entryId)
  const entryIds = turningOn
    ? [...current.entryIds, entryId]
    : current.entryIds.filter((id) => id !== entryId)
  const primaryId = entryIds.includes(current.primaryId ?? '') ? current.primaryId : (entryIds[0] ?? null)
  commit({ tournamentId, entryIds, primaryId })
  emitCheerChange({ tournamentId, entryId, delta: turningOn ? 1 : -1 })
  void cheerSet(tournamentId, entryId, getSpectatorKey(), turningOn)
    .then(() => emitCheerChange({ tournamentId, refetch: true }))
    .catch(() => {
      /* сеть: локальный выбор всё равно остаётся */
    })
}

export function setPrimaryCheer(tournamentId: string, entryId: string) {
  const current = selectionFor(tournamentId)
  const entryIds = current.entryIds.includes(entryId) ? current.entryIds : [...current.entryIds, entryId]
  commit({ tournamentId, entryIds, primaryId: entryId })
  if (!current.entryIds.includes(entryId)) {
    emitCheerChange({ tournamentId, entryId, delta: 1 })
    void cheerSet(tournamentId, entryId, getSpectatorKey(), true)
      .then(() => emitCheerChange({ tournamentId, refetch: true }))
      .catch(() => {})
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCheer(tournamentId: string | undefined): CheerSelection {
  const file = useSyncExternalStore(subscribe, readFile, () => EMPTY_FILE)
  if (!tournamentId || file.tournamentId !== tournamentId) return EMPTY_SELECTION
  return file
}

/** Подтянуть свои серверные «болею» и один раз выгрузить локальный задел. */
export function useCheerSync(tournamentId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tournamentId) return
    let cancelled = false
    const key = getSpectatorKey()
    ;(async () => {
      try {
        const remote = await cheerMine(tournamentId, key)
        if (cancelled) return
        const local = selectionFor(tournamentId)
        const remoteSet = new Set(remote)
        const missingOnServer = local.entryIds.filter((id) => !remoteSet.has(id))
        if (missingOnServer.length > 0) {
          await Promise.all(missingOnServer.map((id) => cheerSet(tournamentId, id, key, true)))
        }
        const merged = [...new Set([...remote, ...local.entryIds])]
        const primaryId =
          local.primaryId && merged.includes(local.primaryId) ? local.primaryId : (merged[0] ?? null)
        commit({ tournamentId, entryIds: merged, primaryId })
        await queryClient.invalidateQueries({ queryKey: cheerCountsKey(tournamentId) })
      } catch {
        /* офлайн / миграция ещё не применена */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tournamentId, queryClient])

  useEffect(() => {
    if (!tournamentId) return
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<CheerChangeDetail>).detail
      if (detail?.tournamentId !== tournamentId) return
      if (detail.entryId && detail.delta) {
        queryClient.setQueryData<Map<string, number>>(cheerCountsKey(tournamentId), (prev) => {
          const next = new Map(prev)
          next.set(detail.entryId!, Math.max(0, (next.get(detail.entryId!) ?? 0) + detail.delta!))
          return next
        })
      }
      if (detail.refetch) {
        void queryClient.invalidateQueries({ queryKey: cheerCountsKey(tournamentId) })
      }
    }
    window.addEventListener('pikecup:cheer-changed', onChange)
    return () => window.removeEventListener('pikecup:cheer-changed', onChange)
  }, [tournamentId, queryClient])
}

export function useCheerCounts(tournamentId: string | undefined) {
  return useQuery({
    queryKey: cheerCountsKey(tournamentId ?? ''),
    queryFn: () => cheerCounts(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
