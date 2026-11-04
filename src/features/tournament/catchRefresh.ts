import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import type { CatchRow } from './types'

type CatchRefreshState = {
  tournamentId: string
  updatedAt: Date | null
  baselineIds: string[]
  newIds: string[]
  hasRefreshed: boolean
  primed: boolean
}

const EMPTY: CatchRefreshState = {
  tournamentId: '',
  updatedAt: null,
  baselineIds: [],
  newIds: [],
  hasRefreshed: false,
  primed: false,
}

let state: CatchRefreshState = EMPTY
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setState(next: CatchRefreshState) {
  state = next
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return state
}

function catchIds(rows: CatchRow[] | undefined): string[] {
  return (rows ?? []).map((row) => row.id)
}

function catchesKey(tournamentId: string) {
  return ['tournament', tournamentId, 'catches'] as const
}

function byIdKey(tournamentId: string) {
  return ['tournament', tournamentId] as const
}

/** Зафиксировать текущий список уловов как базу (без дельты) — при первом заходе. */
export function primeCatchBaseline(tournamentId: string, rows: CatchRow[] | undefined) {
  if (!tournamentId) return
  if (state.tournamentId === tournamentId && state.primed) {
    if (!state.hasRefreshed && state.baselineIds.length === 0 && (rows?.length ?? 0) > 0) {
      setState({
        ...state,
        baselineIds: catchIds(rows),
        updatedAt: new Date(),
      })
    }
    return
  }
  setState({
    tournamentId,
    updatedAt: new Date(),
    baselineIds: catchIds(rows),
    newIds: [],
    hasRefreshed: false,
    primed: true,
  })
}

export function useCatchRefresh(tournamentId: string | undefined) {
  const queryClient = useQueryClient()
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)

  useEffect(() => {
    if (!tournamentId) return
    const sync = () => {
      const rows = queryClient.getQueryData<CatchRow[]>(catchesKey(tournamentId))
      primeCatchBaseline(tournamentId, rows)
    }
    sync()
    return queryClient.getQueryCache().subscribe((event) => {
      const key = event.query.queryKey
      if (!Array.isArray(key) || key[0] !== 'tournament' || key[1] !== tournamentId || key[2] !== 'catches') {
        return
      }
      sync()
    })
  }, [tournamentId, queryClient])

  const fetching = useIsFetching({
    predicate: (query) => {
      if (!tournamentId) return false
      const key = query.queryKey
      if (!Array.isArray(key) || key[0] !== 'tournament' || key[1] !== tournamentId) return false
      return key.length === 2 || key[2] === 'catches' || key[2] === 'cheerCounts'
    },
  })

  const refresh = useCallback(async () => {
    if (!tournamentId) return
    const before = queryClient.getQueryData<CatchRow[]>(catchesKey(tournamentId)) ?? []
    const beforeIds = new Set(catchIds(before))

    await Promise.all([
      queryClient.refetchQueries({ queryKey: byIdKey(tournamentId), exact: true }),
      queryClient.refetchQueries({ queryKey: catchesKey(tournamentId) }),
      queryClient.refetchQueries({ queryKey: ['tournament', tournamentId, 'cheerCounts'] }),
    ])

    const after = queryClient.getQueryData<CatchRow[]>(catchesKey(tournamentId)) ?? []
    const newIds = after.filter((row) => !beforeIds.has(row.id)).map((row) => row.id)

    setState({
      tournamentId,
      updatedAt: new Date(),
      baselineIds: [...beforeIds],
      newIds,
      hasRefreshed: true,
      primed: true,
    })
  }, [queryClient, tournamentId])

  const forTournament = snap.tournamentId === tournamentId ? snap : EMPTY

  return {
    refresh,
    isFetching: fetching > 0,
    updatedAt: forTournament.updatedAt,
    newCatchIds: forTournament.newIds,
    hasRefreshed: forTournament.hasRefreshed,
  }
}
