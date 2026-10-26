import { useSyncExternalStore } from 'react'

const BOARD_KEY = 'pikecup.v2.board'
const RULES_KEY = 'pikecup.v2.rulesSeen'

export type BoardMode = 'all' | 'my-group' | 'shore-a' | 'shore-b'

let boardRaw = '\u0000'
let boardCache: BoardMode = 'all'
let rulesRaw = '\u0000'
let rulesCache = false

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

export function useBoardMode() {
  return useSyncExternalStore(subscribe(boardListeners), readBoardMode, () => 'all' as BoardMode)
}

export function useRulesSeen() {
  return useSyncExternalStore(subscribe(rulesListeners), readRulesSeen, () => false)
}
