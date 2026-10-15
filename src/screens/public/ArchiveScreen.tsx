import { Button, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { formatTournamentDate } from '../../features/tournament/date'
import { useCurrentAndArchive } from '../../features/tournament/hooks'
import { EmptyState, PageHeader, SurfaceCard, TabsBar } from '../../ui'

export function ArchiveScreen() {
  const { current, archive, isLoading } = useCurrentAndArchive()
  const { role } = useAuth()
  const canManage = canManageTournament(role)

  const byYear = useMemo(() => {
    const map = new Map<string, typeof archive>()
    for (const t of archive) {
      const y = t.event_date.slice(0, 4)
      const list = map.get(y) ?? []
      list.push(t)
      map.set(y, list)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [archive])

  if (isLoading) {
    return (
      <div className="pc-page">
        <Text c="dimmed">Загрузка…</Text>
      </div>
    )
  }

  const tabs = [
    { value: 'current', label: 'Текущий' },
    { value: 'archive', label: `Архив (${archive.length})` },
  ]

  const defaultTab = current ? 'current' : 'archive'

  return (
    <div className="pc-page">
      <Stack gap="lg">
        <PageHeader
          title="Турниры"
          rightSection={
            canManage ? (
              <Button component={Link} to="/staff/tournament" color="signal" variant="outline" size="sm">
                Создать
              </Button>
            ) : undefined
          }
        />
        <Text size="sm" c="dimmed">
          Актуальный турнир и архив соревнований PikeCup.
        </Text>

        <TabsBar tabs={tabs} defaultTab={defaultTab}>
          {(active) => (
            <>
              {active === 'current' &&
                (current ? (
                  <SurfaceCard
                    to={`/tournament/${current.id}`}
                    title={current.name}
                    status={current.status}
                    lines={[
                      `${formatTournamentDate(current.event_date)} · ${current.location}`,
                    ]}
                  />
                ) : (
                  <EmptyState
                    title="Нет текущего турнира"
                    description="Загляните в архив или дождитесь публикации."
                  />
                ))}

              {active === 'archive' &&
                (byYear.length === 0 ? (
                  <EmptyState title="Архив пуст" />
                ) : (
                  <Stack gap="lg">
                    {byYear.map(([year, list]) => (
                      <Stack key={year} gap="xs">
                        <Text className="pc-display" size="sm" c="dimmed">
                          {year}
                        </Text>
                        {list.map((t) => (
                          <SurfaceCard
                            key={t.id}
                            to={`/tournament/${t.id}`}
                            title={t.name}
                            status={t.status}
                            lines={[`${formatTournamentDate(t.event_date)} · ${t.location}`]}
                          />
                        ))}
                      </Stack>
                    ))}
                  </Stack>
                ))}
            </>
          )}
        </TabsBar>
      </Stack>
    </div>
  )
}
