import { useSyncExternalStore } from 'react'

const CHEER_KEY = 'pikecup.cheer'

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

export function readCheer(tournamentId: string): string | null {
  const file = readFile()
  return file.tournamentId === tournamentId ? file.primaryId : null
}

export function toggleCheer(tournamentId: string, entryId: string) {
  const current = selectionFor(tournamentId)
  const entryIds = current.entryIds.includes(entryId)
    ? current.entryIds.filter((id) => id !== entryId)
    : [...current.entryIds, entryId]
  const primaryId = entryIds.includes(current.primaryId ?? '') ? current.primaryId : (entryIds[0] ?? null)
  commit({ tournamentId, entryIds, primaryId })
}

export function setPrimaryCheer(tournamentId: string, entryId: string) {
  const current = selectionFor(tournamentId)
  const entryIds = current.entryIds.includes(entryId) ? current.entryIds : [...current.entryIds, entryId]
  commit({ tournamentId, entryIds, primaryId: entryId })
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
