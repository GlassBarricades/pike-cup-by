import { useSyncExternalStore } from 'react'

const FOLLOW_KEY = 'pikecup.v2.follow'
const BOARD_KEY = 'pikecup.v2.board'
const RULES_KEY = 'pikecup.v2.rulesSeen'

export type V2Follow = {
  teamIds: string[]
  athleteId: string | null
}

export type BoardMode = 'all' | 'my-group' | 'shore-a' | 'shore-b'

const EMPTY_FOLLOW: V2Follow = { teamIds: [], athleteId: null }

let followRaw = '\u0000'
let followCache: V2Follow = EMPTY_FOLLOW
let boardRaw = '\u0000'
let boardCache: BoardMode = 'all'
let rulesRaw = '\u0000'
let rulesCache = false

const followListeners = new Set<() => void>()
const boardListeners = new Set<() => void>()
const rulesListeners = new Set<() => void>()

function readStorage(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

function parseFollow(raw: string): V2Follow {
  if (!raw) return EMPTY_FOLLOW
  try {
    const parsed = JSON.parse(raw) as { teamIds?: unknown; athleteId?: unknown }
    const teamIds = Array.isArray(parsed.teamIds) ? parsed.teamIds.filter((id): id is string => typeof id === 'string') : []
    const athleteId = typeof parsed.athleteId === 'string' ? parsed.athleteId : null
    return { teamIds, athleteId }
  } catch {
    return EMPTY_FOLLOW
  }
}

export function readFollow(): V2Follow {
  const raw = readStorage(FOLLOW_KEY)
  if (raw === followRaw) return followCache
  followRaw = raw
  followCache = parseFollow(raw)
  return followCache
}

function commitFollow(next: V2Follow) {
  const raw = JSON.stringify(next)
  writeStorage(FOLLOW_KEY, raw)
  followRaw = raw
  followCache = next
  followListeners.forEach((listener) => listener())
}

export function toggleFollowTeam(teamId: string): V2Follow {
  const current = readFollow()
  const teamIds = current.teamIds.includes(teamId)
    ? current.teamIds.filter((id) => id !== teamId)
    : [...current.teamIds, teamId]
  const next = { ...current, teamIds }
  commitFollow(next)
  return next
}

export function setFollowAthlete(athleteId: string | null): V2Follow {
  const next = { ...readFollow(), athleteId }
  commitFollow(next)
  return next
}

export function readBoardMode(): BoardMode {
  const raw = readStorage(BOARD_KEY)
  if (raw === boardRaw) return boardCache
  boardRaw = raw
  boardCache = raw === 'my-group' || raw === 'shore-a' || raw === 'shore-b' ? raw : 'all'
  return boardCache
}

export function writeBoardMode(mode: BoardMode) {
  writeStorage(BOARD_KEY, mode)
  boardRaw = mode
  boardCache = mode
  boardListeners.forEach((listener) => listener())
}

export function readRulesSeen(): boolean {
  const raw = readStorage(RULES_KEY)
  if (raw === rulesRaw) return rulesCache
  rulesRaw = raw
  rulesCache = raw === '1'
  return rulesCache
}

export function writeRulesSeen() {
  writeStorage(RULES_KEY, '1')
  rulesRaw = '1'
  rulesCache = true
  rulesListeners.forEach((listener) => listener())
}

function subscribe(set: Set<() => void>) {
  return (listener: () => void) => {
    set.add(listener)
    return () => set.delete(listener)
  }
}

export function useV2Follow() {
  return useSyncExternalStore(subscribe(followListeners), readFollow, () => EMPTY_FOLLOW)
}

export function useBoardMode() {
  return useSyncExternalStore(subscribe(boardListeners), readBoardMode, () => 'all' as BoardMode)
}

export function useRulesSeen() {
  return useSyncExternalStore(subscribe(rulesListeners), readRulesSeen, () => false)
}
