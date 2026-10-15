import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTournaments } from './hooks'
import type { Tournament } from './types'

const STORAGE_KEY = 'pikecup.staffTournamentId'

type StaffTournamentContextValue = {
  tournaments: Tournament[]
  selectedId: string | null
  selected: Tournament | null
  setSelectedId: (id: string | null) => void
  loading: boolean
}

const StaffTournamentContext = createContext<StaffTournamentContextValue | null>(null)

export function StaffTournamentProvider({ children }: { children: ReactNode }) {
  const { data: tournaments = [], isLoading } = useTournaments()
  const [selectedId, setSelectedIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  )

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id)
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    if (tournaments.length === 0) return
    const exists = selectedId && tournaments.some((t) => t.id === selectedId)
    if (!exists) {
      setSelectedId(tournaments[0]!.id)
    }
  }, [tournaments, selectedId, setSelectedId])

  const selected = useMemo(
    () => tournaments.find((t) => t.id === selectedId) ?? null,
    [tournaments, selectedId],
  )

  const value = useMemo(
    () => ({
      tournaments,
      selectedId: selected?.id ?? null,
      selected,
      setSelectedId,
      loading: isLoading,
    }),
    [tournaments, selected, setSelectedId, isLoading],
  )

  return (
    <StaffTournamentContext.Provider value={value}>{children}</StaffTournamentContext.Provider>
  )
}

export function useStaffTournament() {
  const ctx = useContext(StaffTournamentContext)
  if (!ctx) {
    throw new Error('useStaffTournament must be used within StaffTournamentProvider')
  }
  return ctx
}
