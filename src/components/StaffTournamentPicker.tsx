import { Select, Text } from '@mantine/core'
import { formatTournamentDate, statusLabel } from '../features/tournament/date'
import { useStaffTournament } from '../features/tournament/StaffTournamentContext'

export function StaffTournamentPicker() {
  const { tournaments, selectedId, setSelectedId, loading } = useStaffTournament()

  if (loading) {
    return (
      <Text size="sm" c="dimmed">
        Загрузка турниров…
      </Text>
    )
  }

  return (
    <Select
      label="Турнир для управления"
      placeholder={tournaments.length ? 'Выберите турнир' : 'Сначала создайте турнир'}
      data={tournaments.map((t) => ({
        value: t.id,
        label: `${formatTournamentDate(t.event_date)} · ${t.name} (${statusLabel[t.status]})`,
      }))}
      value={selectedId}
      onChange={(v) => setSelectedId(v)}
      searchable
      clearable={false}
    />
  )
}
