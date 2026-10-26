import { Stack } from '@mantine/core'
import { Navigate, Outlet } from 'react-router-dom'
import { formatTournamentDate } from '../../features/tournament/date'
import { useActiveTournament, useTournaments } from '../../features/tournament/hooks'
import { EmptyState, SurfaceCard } from '../../ui'

export function V2Shell() {
  return (
    <div className="pc-page pc-page--wide">
      <Outlet />
    </div>
  )
}

export function V2Home() {
  const { data: tournament, isLoading } = useActiveTournament()
  const { data: tournaments = [], isLoading: listLoading } = useTournaments()
  if (isLoading || listLoading) return null
  if (tournament) return <Navigate to={`/live/t/${tournament.id}`} replace />
  const visible = tournaments.filter((item) => item.status !== 'draft')
  if (visible.length === 0) {
    return <EmptyState title="Турниров для обзора нет" description="Когда соревнование опубликуют, день откроется здесь." />
  }
  return (
    <Stack gap="xs">
      {visible.map((item) => (
        <SurfaceCard
          key={item.id}
          to={`/live/t/${item.id}`}
          title={item.name}
          lines={[`${formatTournamentDate(item.event_date)} · ${item.location}`]}
        />
      ))}
    </Stack>
  )
}
